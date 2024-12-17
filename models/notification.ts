export interface INotification {
    sendDate: Date,

    notificationType: string,
    cost: number | null,
    date: Date,
}

// todo: add description
export function mapINotification(data: INotification): INotification {
    return {
        sendDate: new Date(data.sendDate),
        notificationType: data.notificationType || "",
        cost: Number(data.cost || 0),
        date: new Date(data.date),
    }
}

export function mapINotificationToFirebase(data: INotification) {
    return {
        sendDate: new Date().toISOString(),
        notificationType: data.notificationType || "",
        cost: Number(data.cost || 0),
        date: data.date.toISOString(),
    }
}