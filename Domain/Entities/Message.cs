using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Domain.Common.Enums;

namespace Domain.Entities
{
    public class Message
{
    public Guid Id { get; private set; }

    public Guid ConversationId { get; private set; }
    public Guid SenderId { get; private set; }

    public string Content { get; private set; } = string.Empty;

    public DateTime SentAt { get; private set; } = DateTime.UtcNow;
    public DateTime? DeliveredAt { get; private set; }
    public DateTime? SeenAt { get; private set; }

    public bool IsSeen => SeenAt.HasValue;

    public MessageStatus Status { get; private set; } = MessageStatus.Sent;

    // Navigation
    public Conversation Conversation { get; set; } = default!;
    public User Sender { get; set; } = default!;

    public Message(Guid conversationId, Guid senderId, string content)
    {
        ConversationId = conversationId;
        SenderId = senderId;
        Content = content;
    }

    // ===== DOMAIN METHODS =====

    public void Edit(string newContent)
    {
        if (string.IsNullOrWhiteSpace(newContent))
            throw new ArgumentException("Content cannot be empty.");

        Content = newContent;
        Touch();
    }

    public void MarkAsDelivered()
    {
        if (DeliveredAt.HasValue) return;

        DeliveredAt = DateTime.UtcNow;
        Status = MessageStatus.Delivered;
    }

    public void MarkAsSeen()
    {
        if (SeenAt.HasValue) return;

        SeenAt = DateTime.UtcNow;
        Status = MessageStatus.Seen;
    }

    public void MarkAsSent(DateTime? sentAt = null)
    {
        SentAt = sentAt ?? DateTime.UtcNow;
        Status = MessageStatus.Sent;
    }

    // ===== INTERNAL =====
    private void Touch()
    {
        // nếu sau này bạn thêm UpdatedAt thì dùng lại được
    }
}

}

