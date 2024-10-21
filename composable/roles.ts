export const roles = (t: (key: string) => string) => {
    return [
        {title: t('roles.user'), value: 'user'},
        {title: t('roles.workshop'), value: 'workshop'},
    ]
}