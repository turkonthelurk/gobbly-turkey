import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { SocialShareModal } from './SocialShareModal.tsx';

interface Score {
  id: number;
  name: string | null;
  handle: string | null;
  score: number;
  createdAt: string;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
}

export const Leaderboard = ({ isOpen, onClose, currentScore }: LeaderboardProps) => {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<Score | null>(null);

  const fetchTopScores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scores/top?limit=50');
      if (response.ok) {
        const data = await response.json();
        setScores(data);
      }
    } catch (error) {
      console.error('Failed to fetch scores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTopScores();
    }
  }, [isOpen]);

  const handleShare = (score: Score) => {
    setSelectedScore(score);
    setShareModalOpen(true);
  };

  const formatRank = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[80vh] bg-white">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold text-orange-600">
              🦃 Gobbly Turkey Leaderboard 🦃
            </CardTitle>
            {currentScore && (
              <p className="text-sm text-gray-600">
                Your Score: <span className="font-bold text-orange-600">{currentScore}</span>
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading scores...</div>
                </div>
              ) : scores.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">No scores yet!</div>
                  <div className="text-sm text-gray-400">Be the first to set a high score! 🎯</div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {scores.map((score, index) => (
                    <div
                      key={score.id}
                      className={`flex items-center justify-between p-4 hover:bg-gray-50 ${
                        currentScore === score.score ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-xl font-bold min-w-[3rem]">
                          {formatRank(index)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {score.name || 'Anonymous Turkey'}
                          </div>
                          {score.handle && (
                            <div className="text-sm text-blue-600">@{score.handle}</div>
                          )}
                          <div className="text-xs text-gray-500">{formatDate(score.createdAt)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-bold text-orange-600">
                          {score.score.toLocaleString()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(score)}
                          className="h-8 w-8 p-0"
                        >
                          📤
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          
          <div className="p-4 border-t text-center">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </Card>
      </div>

      <SocialShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        score={selectedScore}
      />
    </>
  );
};