type ChatMessageBodyProps = {
  content: string;
};

export function ChatMessageBody({ content }: ChatMessageBodyProps) {
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="ms-chat-body">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="ms-chat-paragraph">
          {paragraph.split("\n").map((line, lineIndex, lines) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
