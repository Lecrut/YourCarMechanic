export const roles = (t: (key: string) => string) => {
    return [
        {title: t('roles.workshop'), value: 'workshop'},
        {title: t('roles.user'), value: 'user'}
    ]
}