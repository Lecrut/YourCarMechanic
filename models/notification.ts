export interface INotification {
    sendDate: Date,

    notificationType: string,
    cost: number | null,
    description: string,

    date: Date,
}

export function mapINotification(data: INotification): INotification {
    return {
        sendDate: new Date(data.sendDate),
        notificationType: data.notificationType || "",
        cost: Number(data.cost || 0),
        description: data.description || "",
        date: new Date(data.date),
    }
}

export function mapINotificationToFirebase(data: INotification) {
    return {
        sendDate: new Date().toISOString(),
        notificationType: data.notificationType || "",
        cost: Number(data.cost || 0),
        description: data.description || "",
        date: data.date.toISOString(),
    }
}