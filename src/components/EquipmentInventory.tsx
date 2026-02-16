import React from 'react';
import { Download, Unplug } from 'lucide-react';
import { EquipmentItem, OwnedEquipment } from '@/hooks/useEquipment';

interface EquipmentInventoryProps {
  owned: OwnedEquipment[];
  catalog: EquipmentItem[];
  currentVoidId: string | null;
  onInstall: (playerEquipmentId: string, voidId: string) => void;
  onUninstall: (playerEquipmentId: string) => void;
}

export function EquipmentInventory({ owned, catalog, currentVoidId, onInstall, onUninstall }: EquipmentInventoryProps) {
  if (owned.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p className="text-xs uppercase tracking-widest font-mono">No equipment acquired yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {owned.map(oe => {
        const item = catalog.find(c => c.id === oe.equipment_id);
        if (!item) return null;
        const isInstalled = !!oe.void_id;
        const isInstalledHere = oe.void_id === currentVoidId;

        return (
          <div
            key={oe.id}
            className={`flex items-center justify-between p-3 border transition-colors ${
              isInstalledHere
                ? 'border-purple-400/50 bg-purple-500/10'
                : 'border-foreground/10 bg-foreground/5'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono uppercase tracking-wider text-foreground truncate">{item.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isInstalled
                  ? isInstalledHere
                    ? 'Installed here'
                    : 'Installed in another void'
                  : 'In inventory'}
              </p>
            </div>
            <div className="flex gap-2 ml-2">
              {currentVoidId && !isInstalledHere && (
                <button
                  onClick={() => onInstall(oe.id, currentVoidId)}
                  className="p-1.5 border border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
                  title="Install to current void"
                >
                  <Download size={12} />
                </button>
              )}
              {isInstalled && (
                <button
                  onClick={() => onUninstall(oe.id)}
                  className="p-1.5 border border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
                  title="Uninstall"
                >
                  <Unplug size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
