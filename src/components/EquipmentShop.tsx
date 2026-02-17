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
  item,
  isOwned,
  canAfford,
  isPurchasing,
  onPurchase,
}: {
  item: EquipmentItem;
  isOwned: boolean;
  canAfford: boolean;
  isPurchasing: boolean;
  onPurchase: () => void;
}) {
  const tierClass = item.tier === 3
    ? 'equipment-tier-3'
    : item.tier === 2
      ? 'equipment-tier-2'
      : '';

  return (
    <div
      className={`p-4 border border-foreground/20 bg-foreground/5 flex flex-col gap-2 ${tierClass}`}
    >
      <div className="flex items-start justify-between">
        <div className="p-2 border border-foreground/10 bg-foreground/5">
          <DynamicIcon name={item.icon} size={18} />
        </div>
        <TierStars tier={item.tier} />
      </div>
      <h3 className="text-xs font-mono uppercase tracking-wider text-foreground">{item.name}</h3>
      <p className="text-[10px] text-muted-foreground leading-relaxed flex-1">{item.description}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="flex items-center gap-1 text-[10px] font-mono text-purple-300/80">
          <Zap size={10} /> {item.energy_cost}
        </span>
        {isOwned ? (
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400/60">Owned</span>
        ) : (
          <button
            onClick={onPurchase}
            disabled={!canAfford || isPurchasing}
            className="btn-brutalist text-[10px] px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Acquire
          </button>
        )}
      </div>
    </div>
  );
}

export function EquipmentShop({ isOpen, onClose, userId, currentVoidId }: EquipmentShopProps) {
  const { catalog, owned, energy, isLoading, purchaseEquipment, isPurchasing, installEquipment, uninstallEquipment } = useEquipmentUnified(userId, currentVoidId);
  const { toast } = useToast();

  const ownedIds = useMemo(() => new Set(owned.map(o => o.equipment_id)), [owned]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePurchase = async (equipmentId: string) => {
    try {
      await purchaseEquipment(equipmentId);
      toast({ title: 'Module acquired', description: 'Check your inventory to install it.' });
    } catch (err: any) {
      toast({ title: 'Acquisition failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] void-navigator-bg flex flex-col"
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="relative w-full h-full border-2 border-foreground bg-background flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-foreground/20">
              <h2 className="text-xs uppercase tracking-[0.5em] text-purple-300/60 font-mono">
                Equipment Bay
              </h2>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs font-mono text-purple-300/80">
                  <Zap size={12} className="text-yellow-400" />
                  {energy}
                </span>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-foreground hover:text-background transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <Tabs defaultValue="link">
                <TabsList className="w-full bg-foreground/5 border border-foreground/10 mb-4">
                  {CATEGORIES.map(cat => (
                    <TabsTrigger
                      key={cat.key}
                      value={cat.key}
                      className="flex-1 text-[10px] uppercase tracking-widest font-mono data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
                    >
                      {cat.label}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger
                    value="inventory"
                    className="flex-1 text-[10px] uppercase tracking-widest font-mono data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
                  >
                    Inventory
                  </TabsTrigger>
                </TabsList>

                {CATEGORIES.map(cat => (
                  <TabsContent key={cat.key} value={cat.key}>
                    <div className="grid grid-cols-2 gap-3">
                      {catalog
                        .filter(item => item.category === cat.key)
                        .map(item => (
                          <EquipmentCard
                            key={item.id}
                            item={item}
                            isOwned={ownedIds.has(item.id)}
                            canAfford={energy >= item.energy_cost}
                            isPurchasing={isPurchasing}
                            onPurchase={() => handlePurchase(item.id)}
                          />
                        ))}
                    </div>
                  </TabsContent>
                ))}

                <TabsContent value="inventory">
                  <EquipmentInventory
                    owned={owned}
                    catalog={catalog}
                    currentVoidId={currentVoidId}
                    onInstall={installEquipment}
                    onUninstall={uninstallEquipment}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
