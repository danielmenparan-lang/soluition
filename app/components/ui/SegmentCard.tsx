type SegmentCardProps = {
  name: string;
  description: string | null;
  segmentType: string;
  memberCount: number;
  refreshedAt: string | null;
};

export function SegmentCard({
  name,
  description,
  segmentType,
  memberCount,
  refreshedAt,
}: SegmentCardProps) {
  return (
    <article className="ms-segment-card">
      <div className="ms-segment-card-top">
        <span className="ms-segment-type">{segmentType}</span>
        {refreshedAt ? (
          <span className="ms-segment-date">
            {new Date(refreshedAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>
      <h3 className="ms-segment-name">{name}</h3>
      {description ? <p className="ms-segment-desc">{description}</p> : null}
      <div className="ms-segment-count">{memberCount.toLocaleString()}</div>
      <p className="ms-segment-count-label">people in segment</p>
    </article>
  );
}
