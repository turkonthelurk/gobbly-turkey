import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Score {
  id: number;
  name: string | null;
  handle: string | null;
  score: number;
  createdAt: string;
}

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: Score | null;
}

export const SocialShareModal = ({ isOpen, onClose, score }: SocialShareModalProps) => {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !score) return null;

  const gameUrl = window.location.href;
  const playerName = score.name || (score.handle ? (score.handle.startsWith('@') ? score.handle.slice(1) : score.handle) : 'Anonymous Turkey');
  const handleForShare = score.handle ? (score.handle.startsWith('@') ? score.handle : '@' + score.handle) : '';
  const shareText = `🦃 I just scored ${score.score.toLocaleString()} points in Gobbly Turkey! ${handleForShare ? `(${handleForShare})` : ''} Can you beat my high score? 🎯`;
  const fullShareText = `${shareText}\n\nPlay now: ${gameUrl}`;

  const shareLinks = {
    twitter: () => {
      const tweetText = encodeURIComponent(`${shareText} #GobbleTurkey #FlappyBird #ThanksgivingGame`);
      const tweetUrl = encodeURIComponent(gameUrl);
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
    },
    
    whatsapp: () => {
      const whatsappText = encodeURIComponent(fullShareText);
      window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
    },
    
    facebook: () => {
      const fbUrl = encodeURIComponent(gameUrl);
      const fbQuote = encodeURIComponent(shareText);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${fbUrl}&quote=${fbQuote}`, '_blank');
    },
    
    reddit: () => {
      const redditTitle = encodeURIComponent(`Gobbly Turkey High Score: ${score.score.toLocaleString()} points! 🦃`);
      const redditUrl = encodeURIComponent(gameUrl);
      window.open(`https://reddit.com/submit?title=${redditTitle}&url=${redditUrl}`, '_blank');
    },
    
    linkedin: () => {
      const linkedinUrl = encodeURIComponent(gameUrl);
      const linkedinSummary = encodeURIComponent(`Just achieved ${score.score.toLocaleString()} points in Gobbly Turkey! 🦃🎯`);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${linkedinUrl}&summary=${linkedinSummary}`, '_blank');
    },
    
    telegram: () => {
      const telegramText = encodeURIComponent(fullShareText);
      window.open(`https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${telegramText}`, '_blank');
    },
    
    email: () => {
      const emailSubject = encodeURIComponent(`Check out my Gobbly Turkey high score! 🦃`);
      const emailBody = encodeURIComponent(`Hi!\n\n${fullShareText}\n\nHappy gaming!\n${playerName}`);
      window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, '_blank');
    },
    
    copy: async () => {
      try {
        await navigator.clipboard.writeText(fullShareText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fullShareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const platforms = [
    { name: 'X.com', action: shareLinks.twitter, icon: '/icons/x.png', color: 'bg-black hover:bg-gray-800' },
    { name: 'WhatsApp', action: shareLinks.whatsapp, icon: '/icons/whatsapp.png', color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Facebook', action: shareLinks.facebook, icon: '/icons/facebook.png', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Reddit', action: shareLinks.reddit, icon: '/icons/reddit.png', color: 'bg-orange-600 hover:bg-orange-700' },
    { name: 'LinkedIn', action: shareLinks.linkedin, icon: '/icons/linkedin.png', color: 'bg-blue-700 hover:bg-blue-800' },
    { name: 'Telegram', action: shareLinks.telegram, icon: '/icons/telegram.png', color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Email', action: shareLinks.email, icon: '/icons/email.png', color: 'bg-gray-600 hover:bg-gray-700' },
    { name: copySuccess ? 'Copied!' : 'Copy Link', action: shareLinks.copy, icon: copySuccess ? '✓' : '📋', color: copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600' },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-xl font-bold text-orange-600">
              Share Your Score! 📤
            </CardTitle>
            <div className="space-y-1">
              <p className="text-lg font-bold">{score.score.toLocaleString()} points</p>
              <p className="text-sm text-gray-600">by {playerName}</p>
              {score.handle && (
                <p className="text-sm text-blue-600">{score.handle.startsWith('@') ? score.handle : '@' + score.handle}</p>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <Button
                  key={platform.name}
                  onClick={() => {
                    platform.action();
                    if (platform.name !== 'Copy Link' && !copySuccess) {
                      setTimeout(onClose, 500); // Close modal after sharing
                    }
                  }}
                  className={`${platform.color} text-white h-12 text-sm font-medium flex items-center justify-center gap-2`}
                >
                  {platform.icon.startsWith('/icons/') ? (
                    <img 
                      src={platform.icon} 
                      alt={platform.name} 
                      className="w-5 h-5 object-contain" 
                    />
                  ) : (
                    <span className="text-lg">{platform.icon}</span>
                  )}
                  {platform.name}
                </Button>
              ))}
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded text-sm text-gray-700">
              <strong>Share preview:</strong>
              <p className="mt-1 italic">&quot;{shareText}&quot;</p>
            </div>
          </CardContent>
          
          <div className="px-6 pb-4 text-center">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};