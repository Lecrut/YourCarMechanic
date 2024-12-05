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