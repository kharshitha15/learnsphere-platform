import React from 'react';
import StarRating from './StarRating';
import { getCourseImage } from '../../constants/courseAssets';

const CourseCard = ({
  course,
  onClick,
  onEnroll,
  onWishlist,
  isWishlisted,
  isEnrolled,
  enrolling,
  showProgress = false
}) => {
  const progress = Math.round(course.progressPercentage || 0);
  const image = course.thumbnailUrl || getCourseImage(course.title);
  const instructor = course.instructorName || course.instructor?.fullName || 'LearnSphere';
  const rating = course.rating || 4.8;
  const reviews = course.totalRatings || course.reviewsCount || 120;

  return (
    <div
      className="group flex flex-col bg-white border border-[#e5e5e5] rounded overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full"
      onClick={() => onClick?.(course.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(course.id)}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#f5f7f8]">
        <img
          src={image}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        {onWishlist && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onWishlist(e, course.id); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center text-sm hover:scale-105 transition"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        )}
        {isEnrolled && (
          <span className="absolute top-2 left-2 bg-[#0056d2] text-white text-[10px] font-bold uppercase px-2 py-1 rounded">
            Enrolled
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <p className="text-[11px] font-semibold text-[#636363] uppercase tracking-wide mb-1 truncate">
          {instructor}
        </p>
        <h3 className="text-sm font-bold text-[#1a1a1a] leading-snug line-clamp-2 group-hover:text-[#0056d2] transition-colors">
          {course.title}
        </h3>

        <div className="mt-2">
          <StarRating rating={rating} count={reviews} />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-[10px] font-semibold text-[#636363] bg-[#f5f7f8] px-2 py-0.5 rounded">
            {course.category || 'Development'}
          </span>
          <span className="text-[10px] font-semibold text-[#636363] bg-[#f5f7f8] px-2 py-0.5 rounded">
            {course.difficulty || course.level || 'Beginner'}
          </span>
        </div>

        {showProgress && isEnrolled && (
          <div className="mt-3 pt-3 border-t border-[#e5e5e5]">
            <div className="flex justify-between text-[11px] text-[#636363] mb-1">
              <span>Progress</span>
              <span className="font-bold text-[#0056d2]">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0056d2] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {onEnroll && !isEnrolled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEnroll(course.id, e); }}
            disabled={enrolling === course.id}
            className="mt-3 w-full py-2 text-xs font-bold text-[#0056d2] border border-[#0056d2] rounded hover:bg-[#0056d2] hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            {enrolling === course.id ? 'Enrolling...' : 'Enroll for Free'}
          </button>
        )}

        {isEnrolled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick?.(course.id); }}
            className="mt-3 w-full py-2 text-xs font-bold text-white bg-[#0056d2] hover:bg-[#00419e] rounded transition cursor-pointer"
          >
            {progress >= 100 ? 'Review Course ✓' : 'Go to Course →'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
