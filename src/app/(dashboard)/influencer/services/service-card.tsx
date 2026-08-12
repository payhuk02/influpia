"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Euro } from "lucide-react";
import { toggleServiceStatus } from "../../actions/services";
import { useState } from "react";
import { toast } from "sonner";

export function ServiceCard({ service }: { service: any }) {
  const [isActive, setIsActive] = useState(service.is_active);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsActive(checked);
    try {
      await toggleServiceStatus(service.id, checked);
      toast.success(checked ? "Prestation activée" : "Prestation désactivée");
    } catch (err) {
      setIsActive(!checked);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <Card className="bg-white/[0.02] border-white/5 overflow-hidden flex flex-col">
      <CardHeader className="pb-4 border-b border-white/5">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg leading-tight">{service.title}</CardTitle>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={handleToggle} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col flex-1">
        <p className="text-sm text-white/70 line-clamp-3 mb-6 flex-1">
          {service.description}
        </p>
        
        <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-sm text-white/50">
            <Clock className="w-4 h-4" />
            <span>{service.delivery_days} jours</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 mb-0.5">Prix fixe</p>
            <p className="text-xl font-bold text-primary flex items-center justify-end gap-1">
              {service.price} <Euro className="w-4 h-4" />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
