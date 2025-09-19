import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';

interface ScoreSubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name?: string; handle?: string; score: number }) => Promise<void>;
  score: number;
  onViewLeaderboard: () => void;
}

export const ScoreSubmissionForm = ({
  isOpen,
  onClose,
  onSubmit,
  score,
  onViewLeaderboard,
}: ScoreSubmissionFormProps) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        name: isAnonymous || !name.trim() ? undefined : name.trim(),
        handle: isAnonymous || !handle.trim() ? undefined : handle.trim(),
        score,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit score:', error);
      alert('Failed to submit score. Please try again!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        score,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewLeaderboard = () => {
    onViewLeaderboard();
    onClose();
  };

  if (submitted) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-600">
                🎉 Score Submitted! 🎉
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <div>
                <p className="text-lg font-bold text-orange-600">
                  {score.toLocaleString()} points
                </p>
                <p className="text-sm text-gray-600">
                  Your score has been added to the leaderboard!
                </p>
              </div>
              
              <div className="space-y-2">
                <Button onClick={handleViewLeaderboard} className="w-full">
                  🏆 View Leaderboard
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-orange-600">
              🦃 Great Game! 🦃
            </CardTitle>
            <p className="text-lg font-bold text-gray-900">
              Final Score: {score.toLocaleString()}
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Add your score to the leaderboard and share your achievement!
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    Submit anonymously
                  </Label>
                </div>

                {!isAnonymous && (
                  <>
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">
                        Display Name (optional)
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={50}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="handle" className="text-sm font-medium">
                        Social Handle (optional)
                      </Label>
                      <Input
                        id="handle"
                        type="text"
                        placeholder="@yourusername"
                        value={handle}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.startsWith('@')) {
                            value = '@' + value;
                          }
                          setHandle(value);
                        }}
                        maxLength={30}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        For X.com, Instagram, etc.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : '🏆 Submit Score'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Skip & Submit Anonymously
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="w-full text-sm text-gray-600"
                >
                  Don't submit score
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};