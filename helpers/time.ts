export function convertToFutureDate(day: string, hour: string): Date {
    const [dayOfWeek, dayMonth] = day.split(', ');
    const [dayNum, month] = dayMonth.split('.').map(Number);

    const hourNum = parseInt(hour, 10);

    const currentYear = new Date().getFullYear();

    let date = new Date(currentYear, month - 1, dayNum, hourNum, 0, 0);

    if (date < new Date()) {
        date.setFullYear(currentYear + 1);
    }

    return date;
}

export function formatDateToString(date: Date) {
    const padToTwoDigits = (num: number) => num.toString().padStart(2, '0')

    const day = padToTwoDigits(date.getDate())
    const month = padToTwoDigits(date.getMonth() + 1)
    const year = date.getFullYear()
    const hours = padToTwoDigits(date.getHours())
    const minutes = padToTwoDigits(date.getMinutes())

    return `${day}.${month}.${year} ${hours}:${minutes}`
}