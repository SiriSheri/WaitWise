import { queryAll, queryOne } from '../db/index.js';
import { WaitTimeStat } from '../types/index.js';

export interface WaitTimeEstimateOptions {
  businessId: string;
  serviceId?: string;
  positionAhead: number; // 0 means next up
  activeCounters?: number;
}

export class WaitTimeCalculator {
  /**
   * Calculates rolling average service time from today's completed tickets
   */
  static getRollingAverageServiceMins(businessId: string, fallbackDefault = 15): number {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const row = queryOne<{ avg_served: number | null }>(
      `SELECT AVG(
         (strftime('%s', completed_at) - strftime('%s', served_at)) / 60
       ) as avg_served
       FROM queue_entries
       WHERE business_id = ?
         AND status = 'completed'
         AND served_at IS NOT NULL
         AND completed_at IS NOT NULL
         AND joined_at >= ?`,
      [businessId, todayStart.toISOString()]
    );

    if (row && row.avg_served && row.avg_served > 0) {
      return Math.round(row.avg_served);
    }

    // Fallback to business profile average
    const biz = queryOne<{ avg_service_time_mins: number }>(
      `SELECT avg_service_time_mins FROM businesses WHERE id = ?`,
      [businessId]
    );

    return biz?.avg_service_time_mins || fallbackDefault;
  }

  /**
   * Retrieves hourly traffic index (1.0 is standard, >1.0 is peak rush, <1.0 is quiet)
   */
  static getCurrentTrafficMultiplier(businessId: string): number {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();

    const stat = queryOne<WaitTimeStat>(
      `SELECT * FROM wait_time_stats
       WHERE business_id = ? AND day_of_week = ? AND hour_of_day = ?`,
      [businessId, dayOfWeek, currentHour]
    );

    if (!stat) return 1.0;

    // Compare with overall daily average
    const avgDayStat = queryOne<{ day_avg: number }>(
      `SELECT AVG(avg_wait_mins) as day_avg FROM wait_time_stats
       WHERE business_id = ? AND day_of_week = ?`,
      [businessId, dayOfWeek]
    );

    if (!avgDayStat || !avgDayStat.day_avg || avgDayStat.day_avg === 0) return 1.0;

    const multiplier = stat.avg_wait_mins / avgDayStat.day_avg;
    // Bound between 0.7 and 1.6
    return Math.max(0.7, Math.min(1.6, multiplier));
  }

  /**
   * Calculates dynamic ETA for a position in line
   */
  static calculateDynamicETA(options: WaitTimeEstimateOptions): number {
    const { businessId, serviceId, positionAhead, activeCounters = 1 } = options;

    if (positionAhead <= 0) {
      return 2; // Next up in line
    }

    const counters = Math.max(1, activeCounters);
    const rollingAvg = this.getRollingAverageServiceMins(businessId);

    let serviceDuration = rollingAvg;
    if (serviceId) {
      const srv = queryOne<{ default_duration_mins: number }>(
        `SELECT default_duration_mins FROM services WHERE id = ?`,
        [serviceId]
      );
      if (srv) {
        serviceDuration = srv.default_duration_mins;
      }
    }

    // Blend specific service duration and real-time counter pace
    const blendedDuration = 0.5 * serviceDuration + 0.5 * rollingAvg;
    const trafficMultiplier = this.getCurrentTrafficMultiplier(businessId);

    const rawWait = (positionAhead * blendedDuration) / counters * trafficMultiplier;
    return Math.max(2, Math.round(rawWait));
  }

  /**
   * Detects if a ticket is experiencing an abnormal / excessive delay
   */
  static isExcessiveDelay(joinedAtIso: string, estimatedWaitMins: number): boolean {
    const joinedTime = new Date(joinedAtIso).getTime();
    const elapsedMins = (Date.now() - joinedTime) / (60 * 1000);
    // If waiting 35% longer than estimated + 5 mins grace period
    const threshold = estimatedWaitMins * 1.35 + 5;
    return elapsedMins > threshold;
  }

  /**
   * Aggregates hourly statistics & recommends best off-peak windows
   */
  static getSmartInsights(businessId: string) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();

    const hourlyStats = queryAll<WaitTimeStat>(
      `SELECT hour_of_day, avg_wait_mins, avg_service_mins, sample_count
       FROM wait_time_stats
       WHERE business_id = ? AND day_of_week = ?
       ORDER BY hour_of_day ASC`,
      [businessId, dayOfWeek]
    );

    // Identify peak vs off-peak hours
    let lowestHours = [...hourlyStats]
      .filter((s) => s.hour_of_day >= 8 && s.hour_of_day <= 20)
      .sort((a, b) => a.avg_wait_mins - b.avg_wait_mins);

    const bestOffPeak = lowestHours.slice(0, 3).map((h) => {
      const startPeriod = h.hour_of_day > 12 ? `${h.hour_of_day - 12} PM` : `${h.hour_of_day} AM`;
      const endHour = h.hour_of_day + 1;
      const endPeriod = endHour > 12 ? `${endHour - 12} PM` : `${endHour} AM`;
      return {
        hour: h.hour_of_day,
        timeRange: `${startPeriod} - ${endPeriod}`,
        avgWaitMins: h.avg_wait_mins,
      };
    });

    const currentStat = hourlyStats.find((s) => s.hour_of_day === currentHour);
    const currentStatus =
      !currentStat || currentStat.avg_wait_mins > 28
        ? 'High Traffic / Peak Hour'
        : currentStat.avg_wait_mins > 15
        ? 'Moderate Traffic'
        : 'Optimal / Fast Service Window';

    return {
      currentHour,
      currentStatus,
      bestOffPeak,
      hourlyStats: hourlyStats.map((s) => ({
        hour: s.hour_of_day,
        hourLabel: s.hour_of_day > 12 ? `${s.hour_of_day - 12} PM` : s.hour_of_day === 12 ? '12 PM' : `${s.hour_of_day} AM`,
        avgWaitMins: s.avg_wait_mins,
        avgServiceMins: s.avg_service_mins,
        sampleCount: s.sample_count,
      })),
    };
  }
}
