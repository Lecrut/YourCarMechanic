export const services = (t: (key: string) => string) => {
    return [
        {title: t('services.bodyWork'), value: 'bodyWork'},
        {title: t('services.paint'), value: 'paint'},
        {title: t('services.electrician'), value: 'electrician'},
        {title: t('services.oil'), value: 'oil'},
        {title: t('services.engine'), value: 'engine'},
        {title: t('services.tires'), value: 'tires'},
        {title: t('services.windows'), value: 'windows'},
        {title: t('services.airConditioning'), value: 'airConditioning'},
        {title: t('services.other'), value: 'other'}
    ]
}