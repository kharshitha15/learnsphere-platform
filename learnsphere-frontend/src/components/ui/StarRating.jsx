import React from 'react';

const StarRating = ({ rating = 4.8, count, size = 'sm', showValue = true }) => {
  const starSize = size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs';
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex ${starSize} text-[#f5b301]`} aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= fullStars ? '' : i === fullStars + 1 && hasHalf ? 'opacity-60' : 'opacity-25'}>
            ★
          </span>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-bold text-[#1a1a1a]">{Number(rating).toFixed(1)}</span>
      )}
      {count != null && (
        <span className="text-xs text-[#636363]">({Number(count).toLocaleString()})</span>
      )}
    </div>
  );
};

export default StarRating;
