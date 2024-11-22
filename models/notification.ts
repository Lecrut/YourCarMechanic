export interface INotification {
    sendDate: Date,

    notificationType: string,
    cost: number | null,
    date: Date | null,
}

export function mapINotification(data: INotification): INotification {
    return {
        sendDate: new Date(data.sendDate),
        notificationType: data.notificationType || "",
        cost: Number(data.cost || 0),
        date: data.date ? new Date(data.date) : null,
    }
}

export function mapINotificationToFirebase(data: INotification) {
    return {
        notificationType: data.notificationType || "",
        cost: Number(data.cost || 0),
        date: data.date ? data.date.toISOString() : null,
    }
}