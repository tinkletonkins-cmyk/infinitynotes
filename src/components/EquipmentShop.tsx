import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Star } from 'lucide-react';
import { icons } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EquipmentItem } from '@/hooks/useEquipment';
import { useEquipmentUnified } from '@/hooks/useEquipmentUnified';
import { EquipmentInventory } from './EquipmentInventory';
import { useToast } from '@/hooks/use-toast';

interface EquipmentShopProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  currentVoidId: string | null;
}

const CATEGORIES = [
  { key: 'link', label: 'Link' },
  { key: 'navigation', label: 'Navigate' },
  { key: 'organization', label: 'Organize' },
  { key: 'expression', label: 'Express' },
];

function DynamicIcon({ name, size = 16 }: { name: string; size?: number }) {
  // Convert kebab-case to PascalCase for lucide lookup
  const pascalName = name
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const IconComponent = (icons as Record<string, React.ComponentType<{ size?: number }>>)[pascalName];
  if (!IconComponent) return <Zap size={size} />;
  return <IconComponent size={size} />;
}

function TierStars({ tier }: { tier: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: tier }).map((_, i) => (
        <Star
          key={i}
          size={8}
          className={tier === 3 ? 'text-yellow-400 fill-yellow-400' : tier === 2 ? 'text-purple-400 fill-purple-400' : 'text-muted-foreground fill-muted-foreground'}
        />
      ))}
    </div>
  );
}

function EquipmentCard({
  item, isOwned, isActive, canAfford, isPurchasing,
  onPurchase, onActivate, onDeactivate,
}: {
  item: EquipmentItem;
  isOwned: boolean;
  isActive: boolean;
  canAfford: boolean;
  isPurchasing: boolean;
  onPurchase: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className={`flex flex-col border transition-colors ${
      isActive ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-foreground/15 bg-foreground/[0.03]'
    }`}>
      {/* Card top */}
      <div className="p-4 flex items-start justify-between gap-2">
        <div className="p-2 border border-foreground/10">
          <DynamicIcon name={item.icon} size={18} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <TierStars tier={item.tier} />
          {isActive && (
            <span className="text-[8px] font-mono uppercase tracking-widest text-yellow-400">● live</span>
          )}
          {isOwned && !isActive && (
            <span className="text-[8px] font-mono uppercase tracking-widest text-foreground/40">owned</span>
          )}
        </div>
      </div>

      {/* Name + description */}
      <div className="px-4 pb-3 flex-1">
        <h3 className="text-[11px] font-mono uppercase tracking-wider mb-1">{item.name}</h3>
        <p className="text-[10px] text-foreground/50 leading-relaxed">{item.description}</p>
      </div>

      {/* Price + action */}
      <div className="border-t border-foreground/10 px-4 py-2.5 flex items-center justify-between">
        {!isOwned ? (
          <>
            <span className="flex items-center gap-1 text-[11px] font-mono text-yellow-300/80">
              <Zap size={10} className="text-yellow-400" />
              {item.energy_cost}
            </span>
            <button
              onClick={onPurchase}
              disabled={!canAfford || isPurchasing}
              className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              Buy
            </button>
          </>
        ) : isActive ? (
          <>
            <span className="text-[10px] font-mono text-yellow-400/60 uppercase tracking-widest">Active</span>
            <button
              onClick={onDeactivate}
              className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 border border-foreground/20 text-foreground/50 hover:bg-foreground hover:text-background transition-colors"
            >
              Stop
            </button>
          </>
        ) : (
          <>
            <span className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest">Ready</span>
            <button
              onClick={onActivate}
              className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Use
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function EquipmentShop({ isOpen, onClose, userId, currentVoidId }: EquipmentShopProps) {
  const { catalog, owned, energy, isLoading, purchaseEquipment, isPurchasing, installEquipment, uninstallEquipment } = useEquipmentUnified(userId, currentVoidId);
  const { toast } = useToast();

  const ownedIds = useMemo(() => new Set(owned.map(o => o.equipment_id)), [owned]);

  const activeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const oe of owned) {
      if (oe.void_id === currentVoidId) map.set(oe.equipment_id, oe.id);
    }
    return map;
  }, [owned, currentVoidId]);

  const getOwnedEntry = (equipmentId: string) =>
    owned.find(o => o.equipment_id === equipmentId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePurchase = async (equipmentId: string) => {
    try {
      await purchaseEquipment(equipmentId);
      toast({ title: 'Module acquired', description: 'Press Use to activate it.' });
    } catch (err: any) {
      toast({ title: 'Acquisition failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleActivate = async (equipmentId: string) => {
    const entry = getOwnedEntry(equipmentId);
    if (!entry || !currentVoidId) return;
    try {
      await installEquipment(entry.id, currentVoidId);
      toast({ title: 'Module activated' });
    } catch {
      toast({ title: 'Activation failed', variant: 'destructive' });
    }
  };

  const handleDeactivate = async (equipmentId: string) => {
    const playerEquipmentId = activeMap.get(equipmentId);
    if (!playerEquipmentId) return;
    try {
      await uninstallEquipment(playerEquipmentId);
      toast({ title: 'Module deactivated' });
    } catch {
      toast({ title: 'Deactivation failed', variant: 'destructive' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] bg-background/95 flex flex-col"
        >
          {/* Shop header — storefront feel */}
          <div className="border-b border-foreground/20 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-foreground/40 mb-0.5">The Void</p>
              <h1 className="text-lg font-mono uppercase tracking-[0.3em]">Equipment Bay</h1>
            </div>
            {/* Currency display */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 border border-yellow-400/30 bg-yellow-400/5 px-3 py-1.5">
                <Zap size={12} className="text-yellow-400" />
                <span className="text-sm font-mono text-yellow-300">{energy}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">energy</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 border border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="link" className="h-full flex flex-col">
              {/* Category tabs */}
              <div className="border-b border-foreground/10 px-6">
                <TabsList className="bg-transparent border-0 gap-0 h-auto p-0">
                  {[...CATEGORIES, { key: 'inventory', label: 'Inventory' }].map(cat => (
                    <TabsTrigger
                      key={cat.key}
                      value={cat.key}
                      className="px-4 py-3 text-[10px] uppercase tracking-widest font-mono bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=inactive]:text-foreground/40 rounded-none"
                    >
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {CATEGORIES.map(cat => (
                  <TabsContent key={cat.key} value={cat.key} className="mt-0">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {catalog
                        .filter(item => item.category === cat.key)
                        .map(item => (
                          <EquipmentCard
                            key={item.id}
                            item={item}
                            isOwned={ownedIds.has(item.id)}
                            isActive={activeMap.has(item.id)}
                            canAfford={energy >= item.energy_cost}
                            isPurchasing={isPurchasing}
                            onPurchase={() => handlePurchase(item.id)}
                            onActivate={() => handleActivate(item.id)}
                            onDeactivate={() => handleDeactivate(item.id)}
                          />
                        ))}
                    </div>
                  </TabsContent>
                ))}

                <TabsContent value="inventory" className="mt-0">
                  <EquipmentInventory
                    owned={owned}
                    catalog={catalog}
                    currentVoidId={currentVoidId}
                    onInstall={installEquipment}
                    onUninstall={uninstallEquipment}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
