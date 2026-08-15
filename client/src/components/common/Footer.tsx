import { Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold tracking-tight">WaitWise</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Smart waiting-time management eliminating physical queues across healthcare, government, salons, dining, and service hubs.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-time Engine Active
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Industries</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/places?category=hospital" className="hover:text-teal-400 transition-colors">Hospitals & Emergency</Link></li>
              <li><Link href="/places?category=clinic" className="hover:text-teal-400 transition-colors">Dental & Specialty Clinics</Link></li>
              <li><Link href="/places?category=government" className="hover:text-teal-400 transition-colors">DMV & Government Services</Link></li>
              <li><Link href="/places?category=salon" className="hover:text-teal-400 transition-colors">Salons & Spas</Link></li>
              <li><Link href="/places?category=restaurant" className="hover:text-teal-400 transition-colors">Restaurants & Dining</Link></li>
              <li><Link href="/places?category=service_center" className="hover:text-teal-400 transition-colors">Tech & Repair Centers</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/places" className="hover:text-teal-400 transition-colors">Explore All Places</Link></li>
              <li><Link href="/dashboard" className="hover:text-teal-400 transition-colors">My Active Tickets</Link></li>
              <li><Link href="/staff/login" className="hover:text-teal-400 transition-colors">Staff Counter Portal</Link></li>
              <li><a href="#how-it-works" className="hover:text-teal-400 transition-colors">How Dynamic ETA Works</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Security & Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by persistent local SQLite, bi-directional WebSockets, and dynamic queue algorithms with zero cloud tracking lock-in.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Role-Based Access Control
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} WaitWise Platform. Built for real people to save real time.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Zero Physical Queues
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
