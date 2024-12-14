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

    const day = padToTwoDigits(new Date(date).getDate())
    const month = padToTwoDigits(new Date(date).getMonth() + 1)
    const year = new Date(date).getFullYear()
    const hours = padToTwoDigits(new Date(date).getHours())
    const minutes = padToTwoDigits(new Date(date).getMinutes())

    return `${day}.${month}.${year} ${hours}:${minutes}`
}