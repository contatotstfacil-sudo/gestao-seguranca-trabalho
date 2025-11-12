import { useState } from "react";
import { X, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoDemoProps {
  videoId?: string; // YouTube video ID
  videoUrl?: string; // URL direta do vídeo (Vimeo, etc)
  thumbnail?: string; // URL da thumbnail customizada
  title?: string;
}

export default function VideoDemo({ 
  videoId, 
  videoUrl, 
  thumbnail,
  title = "Demonstração do TST Fácil"
}: VideoDemoProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePlay = () => {
    setLoading(true);
    setShowVideo(true);
    // Simular loading do vídeo
    setTimeout(() => setLoading(false), 500);
  };

  // Se tiver YouTube video ID
  const youtubeEmbedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : null;

  return (
    <>
      {/* Botão/Thumbnail para abrir vídeo */}
      {!showVideo && (
        <div 
          className="relative cursor-pointer group"
          onClick={handlePlay}
        >
          <div className="relative aspect-video bg-gradient-to-br from-blue-600 to-green-600 rounded-lg overflow-hidden shadow-xl">
            {/* Thumbnail ou placeholder */}
            {thumbnail ? (
              <img 
                src={thumbnail} 
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <Play className="h-20 w-20 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold mb-2">{title}</h3>
                  <p className="text-blue-100">Clique para assistir (2 min)</p>
                </div>
              </div>
            )}
            
            {/* Overlay com botão play */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                <Play className="h-12 w-12 text-blue-600 fill-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal com vídeo */}
      {showVideo && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-5xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button 
                onClick={() => setShowVideo(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fechar vídeo"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Container do vídeo */}
            <div className="relative aspect-video bg-black">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              )}
              
              {/* YouTube Embed */}
              {youtubeEmbedUrl && (
                <iframe
                  src={youtubeEmbedUrl}
                  title={title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setLoading(false)}
                />
              )}

              {/* Vídeo direto (Vimeo, etc) */}
              {videoUrl && !youtubeEmbedUrl && (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  onLoadedData={() => setLoading(false)}
                >
                  Seu navegador não suporta vídeos HTML5.
                </video>
              )}

              {/* Placeholder se não houver vídeo configurado */}
              {!youtubeEmbedUrl && !videoUrl && (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Play className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Configure o vídeo nas props do componente</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Use videoId (YouTube) ou videoUrl (URL direta)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer com CTA */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-t">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-gray-700 text-center sm:text-left">
                  <strong>Gostou do que viu?</strong> Solicite uma demonstração personalizada para sua empresa.
                </p>
                <Button 
                  onClick={() => {
                    setShowVideo(false);
                    // Scroll para formulário de contato
                    document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                >
                  Solicitar Demonstração
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



