'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { Contract } from '@/types/contracts';

interface ContractCardProps {
  contract: Contract;
  onView: (contractId: string) => void;
  onSign?: (contractId: string) => void;
  canSign?: boolean;
}

export function ContractCard({ contract, onView, onSign, canSign }: ContractCardProps) {
  const statusConfig = {
    draft: { label: 'Brouillon', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: FileText },
    pending_brand_signature: { label: 'Signature Marque', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    pending_influencer_signature: { label: 'Signature Influenceur', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    signed: { label: 'Signé', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
    amended: { label: 'Amendé', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: FileText },
    terminated: { label: 'Terminé', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertCircle },
    expired: { label: 'Expiré', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Clock },
  };

  const config = statusConfig[contract.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  return (
    <Card className="bg-white/[0.02] border-white/10 hover:border-white/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <CardTitle className="text-base font-semibold">{contract.contract_number}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {contract.template?.name || 'Contrat personnalisé'}
            </CardDescription>
          </div>
          <Badge variant="outline" className={config.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <Calendar className="w-4 h-4" />
            <span>Effet: {new Date(contract.effective_date).toLocaleDateString('fr-FR')}</span>
          </div>
          {contract.expiry_date && (
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="w-4 h-4" />
              <span>Expire: {new Date(contract.expiry_date).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          {contract.collaboration && (
            <div className="flex items-center gap-2 text-white/60">
              <DollarSign className="w-4 h-4" />
              <span>{(contract.collaboration.agreed_amount / 100).toFixed(2)} €</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(contract.id)}
            className="flex-1 text-white/60 hover:text-white"
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
          {canSign && onSign && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onSign(contract.id)}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Signer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
