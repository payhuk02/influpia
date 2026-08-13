'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Save, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  onSaveSearch?: () => void;
  searchType: 'campaign' | 'influencer' | 'collaboration';
}

export function SearchFilters({ onFiltersChange, onSaveSearch, searchType }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({
    niches: [],
    platforms: [],
    followerRange: [0, 1000000],
    engagementRateRange: [0, 10],
    priceRange: [0, 100000],
    verifiedOnly: false,
    hasKYC: false,
    ratingMin: 0,
  });

  const niches = [
    'Mode', 'Beauté', 'Tech', 'Food', 'Voyage', 'Fitness', 'Gaming', 
    'Musique', 'Art', 'Business', 'Éducation', 'Lifestyle'
  ];

  const platforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn', 'Facebook'];

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayItem = (key: string, item: string) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i: string) => i !== item)
      : [...currentArray, item];
    handleFilterChange(key, newArray);
  };

  const clearFilters = () => {
    const clearedFilters = {
      niches: [],
      platforms: [],
      followerRange: [0, 1000000],
      engagementRateRange: [0, 10],
      priceRange: [0, 100000],
      verifiedOnly: false,
      hasKYC: false,
      ratingMin: 0,
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(
    v => Array.isArray(v) ? v.length > 0 : v !== false && v !== 0
  ).length;

  return (
    <Card className="bg-white/[0.02] border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Filtres de recherche</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {activeFiltersCount} actifs
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-white/60 hover:text-white"
              >
                <X className="w-4 h-4 mr-1" />
                Effacer
              </Button>
            )}
            {onSaveSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveSearch}
                className="border-primary/20"
              >
                <Save className="w-4 h-4 mr-1" />
                Sauvegarder
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Search Input */}
          <div>
            <Label className="text-white/60 text-sm">Recherche textuelle</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Rechercher par nom, description..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                onChange={(e) => handleFilterChange('query', e.target.value)}
              />
            </div>
          </div>

          {/* Niches */}
          <div>
            <Label className="text-white/60 text-sm mb-3 block">Niches</Label>
            <div className="flex flex-wrap gap-2">
              {niches.map((niche) => (
                <Badge
                  key={niche}
                  variant={filters.niches?.includes(niche) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    filters.niches?.includes(niche)
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
                  }`}
                  onClick={() => toggleArrayItem('niches', niche)}
                >
                  {niche}
                </Badge>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <Label className="text-white/60 text-sm mb-3 block">Plateformes</Label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <Badge
                  key={platform}
                  variant={filters.platforms?.includes(platform) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    filters.platforms?.includes(platform)
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
                  }`}
                  onClick={() => toggleArrayItem('platforms', platform)}
                >
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          {/* Follower Range */}
          <div>
            <Label className="text-white/60 text-sm mb-3 block">
              Abonnés: {filters.followerRange[0].toLocaleString()} - {filters.followerRange[1].toLocaleString()}
            </Label>
            <Slider
              value={filters.followerRange}
              onValueChange={(value) => handleFilterChange('followerRange', value)}
              max={1000000}
              step={10000}
              className="mt-2"
            />
          </div>

          {/* Engagement Rate Range */}
          <div>
            <Label className="text-white/60 text-sm mb-3 block">
              Taux d'engagement: {filters.engagementRateRange[0]}% - {filters.engagementRateRange[1]}%
            </Label>
            <Slider
              value={filters.engagementRateRange}
              onValueChange={(value) => handleFilterChange('engagementRateRange', value)}
              max={10}
              step={0.5}
              className="mt-2"
            />
          </div>

          {/* Price Range */}
          {searchType === 'influencer' && (
            <div>
              <Label className="text-white/60 text-sm mb-3 block">
                Budget: {(filters.priceRange[0] / 100).toFixed(0)}€ - {(filters.priceRange[1] / 100).toFixed(0)}€
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => handleFilterChange('priceRange', value)}
                max={100000}
                step={1000}
                className="mt-2"
              />
            </div>
          )}

          {/* Rating */}
          <div>
            <Label className="text-white/60 text-sm mb-3 block">Note minimum</Label>
            <Select
              value={filters.ratingMin.toString()}
              onValueChange={(value) => handleFilterChange('ratingMin', parseInt(value))}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Toutes les notes" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10">
                <SelectItem value="0">Toutes les notes</SelectItem>
                <SelectItem value="3">3+ étoiles</SelectItem>
                <SelectItem value="4">4+ étoiles</SelectItem>
                <SelectItem value="5">5 étoiles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="verified"
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => handleFilterChange('verifiedOnly', checked)}
              />
              <Label htmlFor="verified" className="text-white/60 cursor-pointer">
                Vérifié uniquement
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="kyc"
                checked={filters.hasKYC}
                onCheckedChange={(checked) => handleFilterChange('hasKYC', checked)}
              />
              <Label htmlFor="kyc" className="text-white/60 cursor-pointer">
                KYC validé
              </Label>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
