import React, { useState } from 'react';

const LazyImage = ({ src, alt, className = '', onError, fallback }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleError = (e) => {
    if (!errored) {
      setErrored(true);
      if (fallback) e.target.src = fallback;
      if (onError) onError(e);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Skeleton affiché tant que l'image n'est pas chargée */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default LazyImage;
