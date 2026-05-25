/**
 * LoadingSkeleton Components
 * Beautiful loading states for different content types
 */

export function ProductCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-text"></div>
        <div className="skeleton-text skeleton-text--short"></div>
        <div className="skeleton-button"></div>
      </div>

      <style>{`
        .skeleton-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .skeleton-image {
          width: 100%;
          height: 200px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-content {
          padding: 16px;
        }

        .skeleton-title {
          height: 24px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .skeleton-text {
          height: 16px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .skeleton-text--short {
          width: 60%;
        }

        .skeleton-button {
          height: 40px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
          margin-top: 16px;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .dark-mode .skeleton-image,
        .dark-mode .skeleton-title,
        .dark-mode .skeleton-text,
        .dark-mode .skeleton-button {
          background: linear-gradient(
            90deg,
            #374151 25%,
            #4b5563 50%,
            #374151 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .dark-mode .skeleton-card {
          background: #1f2937;
        }
      `}</style>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="skeleton-order">
      <div className="skeleton-order-header">
        <div className="skeleton-text" style={{ width: '40%' }}></div>
        <div className="skeleton-text" style={{ width: '20%' }}></div>
      </div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text skeleton-text--short"></div>

      <style>{`
        .skeleton-order {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .skeleton-order-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .dark-mode .skeleton-order {
          background: #1f2937;
        }
      `}</style>
    </div>
  );
}

export default ProductCardSkeleton;

