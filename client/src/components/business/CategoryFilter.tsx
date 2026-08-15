import {
  Hospital,
  Stethoscope,
  Scissors,
  Landmark,
  UtensilsCrossed,
  Wrench,
  Layers,
} from 'lucide-react';

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

const CATEGORIES: Array<{ id: string; label: string; icon: any }> = [
  { id: 'all', label: 'All Places', icon: Layers },
  { id: 'hospital', label: 'Hospitals', icon: Hospital },
  { id: 'clinic', label: 'Dental & Clinics', icon: Stethoscope },
  { id: 'government', label: 'Government & DMV', icon: Landmark },
  { id: 'salon', label: 'Salons & Spas', icon: Scissors },
  { id: 'restaurant', label: 'Dining & Bistros', icon: UtensilsCrossed },
  { id: 'service_center', label: 'Tech Repair Hubs', icon: Wrench },
];

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all ${
              isActive
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 ring-2 ring-slate-900'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
