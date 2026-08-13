import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Flame, Medal, Award, TrendingUp, Lock } from "lucide-react";
import { getUserXP, getUserBadges, getLeaderboard, getUserAchievements, getUserLevels } from "../actions/gamification";
import { ClaimRewardButton } from "@/components/dashboard/feature-forms";

export default async function GamificationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const userXP = await getUserXP(user.id);
  const userBadges = await getUserBadges(user.id);
  const leaderboard = await getLeaderboard('xp_all_time', 10);
  const achievements = await getUserAchievements(user.id);
  const levels = await getUserLevels();

  const currentLevel = levels?.find(l => l.level === userXP?.current_level);
  const nextLevel = levels?.find(l => l.level === (userXP?.current_level || 0) + 1);
  const xpProgress = nextLevel 
    ? ((userXP?.current_xp || 0) / (nextLevel.min_xp - currentLevel?.min_xp || 1)) * 100 
    : 100;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gamification</h1>
        <p className="text-white/60">
          Gagnez des XP, débloquez des badges et grimpez dans le classement.
        </p>
      </div>

      {/* XP & Level Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Niveau {userXP?.current_level || 1}</CardTitle>
                <CardDescription>{currentLevel?.level_name || 'Novice'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">XP actuel</span>
                <span className="font-bold">{userXP?.current_xp || 0} XP</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
              <div className="flex justify-between text-xs text-white/40">
                <span>{currentLevel?.min_xp || 0} XP</span>
                <span>Prochain: {nextLevel?.min_xp || 'Max'} XP</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <CardTitle className="text-2xl">{userXP?.streak_days || 0}</CardTitle>
                <CardDescription>Jours consécutifs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white/60">
              Meilleure série: {userXP?.longest_streak || 0} jours
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              <div>
                <CardTitle className="text-2xl">{userXP?.total_xp_earned || 0}</CardTitle>
                <CardDescription>XP total gagné</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white/60">
              Depuis votre inscription
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Classement</TabsTrigger>
          <TabsTrigger value="achievements">Missions</TabsTrigger>
          <TabsTrigger value="levels">Niveaux</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userBadges?.map((userBadge) => {
              const badge = userBadge.badge;
              const rarityColors = {
                common: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                rare: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                epic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                legendary: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              };

              return (
                <Card key={userBadge.id} className="bg-black/40 border-white/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="w-6 h-6 text-primary" />
                      <Badge variant="outline" className={rarityColors[badge.rarity as keyof typeof rarityColors]}>
                        {badge.rarity}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{badge.display_name}</CardTitle>
                    <CardDescription className="text-xs">{badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-white/40">
                      Débloqué le {new Date(userBadge.earned_at).toLocaleDateString('fr-FR')}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {userBadges?.length === 0 && (
            <Card className="bg-black/40 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Medal className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60">Aucun badge débloqué pour le moment</p>
                <p className="text-sm text-white/40">Complétez des missions pour gagner des badges</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle>Classement XP - Tous les temps</CardTitle>
              <CardDescription>Top 10 des utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard?.map((entry, index) => {
                  const isCurrentUser = entry.user_id === user.id;
                  const rankColors = [
                    'bg-amber-500/20 text-amber-400 border-amber-500/30',
                    'bg-gray-400/20 text-gray-300 border-gray-400/30',
                    'bg-amber-700/20 text-amber-600 border-amber-700/30',
                  ];

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 p-3 rounded-xl ${
                        isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-white/[0.02]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index < 3 ? rankColors[index] : 'bg-white/5 text-white/60'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {entry.user?.display_name || 'Utilisateur'}
                          {isCurrentUser && <span className="ml-2 text-xs text-primary">(Vous)</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{entry.score} XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements?.map((progress) => {
              const achievement = progress.achievement;
              const progressValue = progress.progress?.current || 0;
              const targetValue = progress.progress?.target || 1;
              const progressPercent = (progressValue / targetValue) * 100;

              return (
                <Card key={progress.id} className="bg-black/40 border-white/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-base">{achievement.display_name}</CardTitle>
                      {progress.is_completed ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Complété
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-white/5 text-white/60 border-white/10">
                          En cours
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{progressValue} / {targetValue}</span>
                      <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    {progress.is_completed && !progress.reward_claimed && (
                      <ClaimRewardButton progressId={progress.id} />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="levels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels?.map((level) => {
              const isCurrentLevel = level.level === userXP?.current_level;
              const isUnlocked = (userXP?.current_xp || 0) >= level.min_xp;
              const isNextLevel = level.level === (userXP?.current_level || 0) + 1;

              return (
                <Card
                  key={level.id}
                  className={`${
                    isCurrentLevel
                      ? 'bg-gradient-to-br from-primary/20 to-transparent border-primary/30'
                      : isUnlocked
                      ? 'bg-white/[0.02] border-white/10'
                      : 'bg-black/40 border-white/5 opacity-50'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star className={`w-5 h-5 ${isUnlocked ? 'text-primary' : 'text-white/30'}`} />
                        <CardTitle className="text-base">Niveau {level.level}</CardTitle>
                      </div>
                      {isCurrentLevel && (
                        <Badge className="bg-primary text-white">Actuel</Badge>
                      )}
                      {!isUnlocked && <Lock className="w-4 h-4 text-white/30" />}
                    </div>
                    <CardTitle className="text-lg">{level.level_name}</CardTitle>
                    <CardDescription className="text-xs">{level.min_xp} XP requis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-white/60">
                        Multiplicateur XP: <span className="text-white font-bold">x{level.xp_multiplier}</span>
                      </div>
                      <div className="text-xs text-white/40">
                        {level.max_xp ? `Max: ${level.max_xp} XP` : 'Niveau maximum'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
