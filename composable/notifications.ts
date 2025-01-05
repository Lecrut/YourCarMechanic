export const notifications = (t: (key: string) => string) => {
    return [
        {title: t('fixStatues.getCar'), value: 'getCar'},
        {title: t('fixStatues.addGiveBackTime'), value: 'addGiveBackTime'},
        {title: t('fixStatues.addExpense'), value: 'addExpense'},
        {title: t('fixStatues.giveBackCar'), value: 'giveBackCar'},
        {title: t('fixStatues.userCancel'), value: 'userCancel'},
        {title: t('fixStatues.workshopCancel'), value: 'workshopCancel'}
    ]
}

export const startNotification = (t: (key: string) => string) => {
    return [
        {title: t('fixStatues.getCar'), value: 'getCar'},
        {title: t('fixStatues.workshopCancel'), value: 'workshopCancel'}
    ]
}

export const duringNotification = (t: (key: string) => string) => {
    return [
        {title: t('fixStatues.addGiveBackTime'), value: 'addGiveBackTime'},
        {title: t('fixStatues.addExpense'), value: 'addExpense'},
        {title: t('fixStatues.giveBackCar'), value: 'giveBackCar'},
    ]
}

