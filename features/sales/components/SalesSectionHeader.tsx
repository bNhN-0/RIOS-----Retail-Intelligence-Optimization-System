import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SalesSectionHeaderProps = {
  badge: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  actionsClassName?: string;
};

export function SalesSectionHeader({
  badge,
  title,
  description,
  actions,
  actionsClassName,
}: SalesSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1.5">
        <Badge className="bg-slate-900 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100">
          {badge}
        </Badge>
        <div>
          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{title}</CardTitle>
          {description ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className={cn("flex flex-wrap items-center gap-2", actionsClassName)}>
          {actions}
        </div>
      ) : null}
    </div>
  );
}
