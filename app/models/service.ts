/** A repair type from the moderator-managed `services` collection. */
import { type ISoftDeletable, toDeletedAt } from '~/models/softDelete'

export type ServiceCategory
  = | 'diagnostics'
    | 'mechanics'
    | 'brakesSuspension'
    | 'electrics'
    | 'bodyPaint'
    | 'tires'
    | 'glass'
    | 'other'

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'diagnostics',
  'mechanics',
  'brakesSuspension',
  'electrics',
  'bodyPaint',
  'tires',
  'glass',
  'other',
]

export interface IService extends ISoftDeletable {
  key: string
  namePl: string
  nameEn: string
  category: ServiceCategory
  active: boolean
  order: number
}

export function mapIService(data: Partial<Omit<IService, 'deletedAt'>> & { deletedAt?: unknown }): IService {
  const category = SERVICE_CATEGORIES.includes(data.category as ServiceCategory) ? (data.category as ServiceCategory) : 'other'
  return {
    key: data.key || '',
    namePl: data.namePl || data.key || '',
    nameEn: data.nameEn || data.namePl || data.key || '',
    category,
    active: data.active ?? true,
    order: Number(data.order ?? 0),
    deletedAt: toDeletedAt(data.deletedAt),
  }
}

/** Initial catalog – used when the collection is empty and for seeding by a moderator. */
export const DEFAULT_SERVICES: IService[] = ([
  // Diagnostyka i przeglądy
  { key: 'diagnostics', namePl: 'Diagnostyka komputerowa OBD', nameEn: 'OBD computer diagnostics', category: 'diagnostics' },
  { key: 'errorReset', namePl: 'Odczyt i kasowanie błędów', nameEn: 'Fault code reading & reset', category: 'diagnostics' },
  { key: 'ecuAdaptation', namePl: 'Kodowanie i adaptacje sterowników', nameEn: 'ECU coding & adaptations', category: 'diagnostics' },
  { key: 'liveDataLogs', namePl: 'Logi dynamiczne parametrów silnika', nameEn: 'Dynamic engine live-data logs', category: 'diagnostics' },
  { key: 'prePurchaseCheck', namePl: 'Przegląd przed zakupem auta', nameEn: 'Pre-purchase inspection', category: 'diagnostics' },
  { key: 'inspection', namePl: 'Przegląd okresowy', nameEn: 'Periodic inspection', category: 'diagnostics' },
  { key: 'seasonalCheck', namePl: 'Przegląd przedzimowy / przedwakacyjny', nameEn: 'Seasonal safety check', category: 'diagnostics' },
  { key: 'oil', namePl: 'Wymiana oleju silnikowego i filtra', nameEn: 'Engine oil & filter change', category: 'diagnostics' },
  { key: 'engineFlush', namePl: 'Płukanka silnika przy wymianie oleju', nameEn: 'Engine oil flush', category: 'diagnostics' },
  { key: 'airFilter', namePl: 'Wymiana filtra powietrza', nameEn: 'Air filter replacement', category: 'diagnostics' },
  { key: 'cabinFilter', namePl: 'Wymiana filtra kabinowego', nameEn: 'Cabin filter replacement', category: 'diagnostics' },
  { key: 'fuelFilter', namePl: 'Wymiana filtra paliwa', nameEn: 'Fuel filter replacement', category: 'diagnostics' },
  { key: 'coolantChange', namePl: 'Wymiana płynu chłodniczego', nameEn: 'Coolant flush & change', category: 'diagnostics' },
  { key: 'sparkPlugs', namePl: 'Wymiana świec zapłonowych', nameEn: 'Spark plugs replacement', category: 'diagnostics' },
  { key: 'glowPlugs', namePl: 'Wymiana świec żarowych', nameEn: 'Glow plugs replacement', category: 'diagnostics' },
  { key: 'compressionTest', namePl: 'Pomiar ciśnienia sprężania', nameEn: 'Compression test', category: 'diagnostics' },
  { key: 'co2HeadTest', namePl: 'Test UPG na obecność CO2 w płynie', nameEn: 'Head gasket CO2 leak test', category: 'diagnostics' },
  { key: 'cylinderEndoscopy', namePl: 'Endoskopia cylindrów kamerą', nameEn: 'Cylinder borescope inspection', category: 'diagnostics' },

  // Mechanika i napęd
  { key: 'engine', namePl: 'Naprawa i remont silnika', nameEn: 'Engine repair & overhaul', category: 'mechanics' },
  { key: 'cylinderHead', namePl: 'Planowanie i regeneracja głowicy', nameEn: 'Cylinder head machining', category: 'mechanics' },
  { key: 'headGasket', namePl: 'Wymiana uszczelki pod głowicą', nameEn: 'Head gasket replacement', category: 'mechanics' },
  { key: 'valveCoverGasket', namePl: 'Uszczelka pokrywy zaworów', nameEn: 'Valve cover gasket', category: 'mechanics' },
  { key: 'oilPanGasket', namePl: 'Uszczelnienie miski olejowej', nameEn: 'Oil pan gasket / reseal', category: 'mechanics' },
  { key: 'crankshaftSeal', namePl: 'Wymiana uszczelniaczy wału korbowego', nameEn: 'Crankshaft oil seals replacement', category: 'mechanics' },
  { key: 'timingBelt', namePl: 'Wymiana paska rozrządu', nameEn: 'Timing belt replacement', category: 'mechanics' },
  { key: 'timingChain', namePl: 'Wymiana łańcucha rozrządu', nameEn: 'Timing chain replacement', category: 'mechanics' },
  { key: 'vvtVariator', namePl: 'Wymiana koła zmiennych faz rozrządu', nameEn: 'VVT cam phaser replacement', category: 'mechanics' },
  { key: 'waterPump', namePl: 'Wymiana pompy wody', nameEn: 'Water pump replacement', category: 'mechanics' },
  { key: 'driveBelt', namePl: 'Wymiana paska wielorowkowego i rolek', nameEn: 'Serpentine belt & pulleys', category: 'mechanics' },
  { key: 'crankPulley', namePl: 'Wymiana koła pasowego wału', nameEn: 'Crankshaft pulley / damper', category: 'mechanics' },
  { key: 'turbo', namePl: 'Regeneracja / wymiana turbosprężarki', nameEn: 'Turbocharger repair / replacement', category: 'mechanics' },
  { key: 'turboActuator', namePl: 'Naprawa nastawnika / zaworu turbiny', nameEn: 'Turbo actuator / boost valve', category: 'mechanics' },
  { key: 'intercooler', namePl: 'Naprawa / wymiana intercoolera i dolotu', nameEn: 'Intercooler & intake piping', category: 'mechanics' },
  { key: 'intakeManifold', namePl: 'Czyszczenie kolektora ssącego / klap', nameEn: 'Intake manifold & swirl flaps', category: 'mechanics' },
  { key: 'throttleBody', namePl: 'Czyszczenie i adaptacja przepustnicy', nameEn: 'Throttle body cleaning & adaptation', category: 'mechanics' },
  { key: 'mafSensor', namePl: 'Wymiana przepływomierza MAF / MAP', nameEn: 'MAF / MAP sensor replacement', category: 'mechanics' },
  { key: 'injectors', namePl: 'Regeneracja / wymiana wtryskiwaczy', nameEn: 'Fuel injectors service', category: 'mechanics' },
  { key: 'highPressurePump', namePl: 'Pompa wysokiego ciśnienia CR / GDI', nameEn: 'High-pressure fuel pump', category: 'mechanics' },
  { key: 'fuelPumpTank', namePl: 'Wymiana pompy paliwa w zbiorniku', nameEn: 'In-tank fuel pump replacement', category: 'mechanics' },
  { key: 'fuelRailSensor', namePl: 'Czujnik / regulator ciśnienia paliwa', nameEn: 'Fuel rail pressure sensor / valve', category: 'mechanics' },
  { key: 'dpfCleaning', namePl: 'Czyszczenie / regeneracja filtra DPF/FAP', nameEn: 'DPF/FAP filter cleaning', category: 'mechanics' },
  { key: 'dpfSensor', namePl: 'Wymiana czujnika różnicy ciśnień DPF', nameEn: 'DPF differential pressure sensor', category: 'mechanics' },
  { key: 'egrValve', namePl: 'Czyszczenie / wymiana zaworu EGR', nameEn: 'EGR valve service', category: 'mechanics' },
  { key: 'egrCooler', namePl: 'Wymiana chłodnicy spalin EGR', nameEn: 'EGR cooler replacement', category: 'mechanics' },
  { key: 'adblueSystem', namePl: 'Naprawa układu AdBlue / SCR / NOx', nameEn: 'AdBlue / SCR / NOx repair', category: 'mechanics' },
  { key: 'radiator', namePl: 'Wymiana chłodnicy silnika', nameEn: 'Engine radiator replacement', category: 'mechanics' },
  { key: 'thermostat', namePl: 'Wymiana termostatu i obudowy', nameEn: 'Thermostat & housing replacement', category: 'mechanics' },
  { key: 'coolantExpansionTank', namePl: 'Wymiana zbiorniczka i przewodów płynu', nameEn: 'Expansion tank & coolant hoses', category: 'mechanics' },
  { key: 'coolingFan', namePl: 'Wymiana wentylatora chłodnicy', nameEn: 'Radiator cooling fan replacement', category: 'mechanics' },
  { key: 'oilCooler', namePl: 'Wymiana chłodniczki oleju', nameEn: 'Oil cooler replacement', category: 'mechanics' },
  { key: 'gearboxManual', namePl: 'Naprawa skrzyni biegów manualnej', nameEn: 'Manual gearbox repair', category: 'mechanics' },
  { key: 'gearboxAuto', namePl: 'Naprawa skrzyni automatycznej / DSG', nameEn: 'Automatic / DSG gearbox repair', category: 'mechanics' },
  { key: 'gearboxOil', namePl: 'Wymiana oleju w skrzyni (statyczna/dynamiczna)', nameEn: 'Gearbox oil change', category: 'mechanics' },
  { key: 'gearShifter', namePl: 'Regulacja / wymiana linek i wybieraka biegów', nameEn: 'Gear shifter & linkage repair', category: 'mechanics' },
  { key: 'clutch', namePl: 'Wymiana kompletnego sprzęgła', nameEn: 'Clutch kit replacement', category: 'mechanics' },
  { key: 'clutchHydraulics', namePl: 'Wymiana wysprzęglika / pompki sprzęgła', nameEn: 'Clutch slave / master cylinder', category: 'mechanics' },
  { key: 'dualMass', namePl: 'Wymiana koła dwumasowego', nameEn: 'Dual-mass flywheel replacement', category: 'mechanics' },
  { key: 'engineMounts', namePl: 'Wymiana poduszek silnika i skrzyni', nameEn: 'Engine & gearbox mounts', category: 'mechanics' },
  { key: 'cvJoint', namePl: 'Wymiana przegubu / osłony przegubu', nameEn: 'CV joint & boot replacement', category: 'mechanics' },
  { key: 'driveshaftAxle', namePl: 'Wymiana półosi napędowej', nameEn: 'Drive axle replacement', category: 'mechanics' },
  { key: 'propShaft', namePl: 'Wyważanie / naprawa wału napędowego', nameEn: 'Propshaft repair & balancing', category: 'mechanics' },
  { key: 'differential', namePl: 'Serwis dyferencjału / Haldex / 4x4', nameEn: 'Differential / AWD / Haldex service', category: 'mechanics' },
  { key: 'exhaust', namePl: 'Naprawa / wymiana tłumika i wydechu', nameEn: 'Exhaust & muffler repair', category: 'mechanics' },
  { key: 'flexPipe', namePl: 'Wymiana złącza elastycznego wydechu', nameEn: 'Exhaust flex pipe replacement', category: 'mechanics' },
  { key: 'catalyticConverter', namePl: 'Wymiana katalizatora', nameEn: 'Catalytic converter replacement', category: 'mechanics' },
  { key: 'lambdaSensor', namePl: 'Wymiana sondy lambda / czujnika EGT', nameEn: 'Lambda / EGT sensor replacement', category: 'mechanics' },

  // Hamulce i zawieszenie
  { key: 'brakes', namePl: 'Wymiana klocków hamulcowych', nameEn: 'Brake pads replacement', category: 'brakesSuspension' },
  { key: 'brakeDiscs', namePl: 'Wymiana tarcz i klocków hamulcowych', nameEn: 'Brake discs & pads replacement', category: 'brakesSuspension' },
  { key: 'drumBrakes', namePl: 'Wymiana szczęk, bębnów i cylinderków', nameEn: 'Drum brakes & wheel cylinders', category: 'brakesSuspension' },
  { key: 'brakeCalipers', namePl: 'Regeneracja / wymiana zacisków hamulcowych', nameEn: 'Brake calipers service', category: 'brakesSuspension' },
  { key: 'brakeMasterCylinder', namePl: 'Wymiana pompy hamulcowej / serwa', nameEn: 'Master cylinder & brake booster', category: 'brakesSuspension' },
  { key: 'brakeFluid', namePl: 'Wymiana i odpowietrzenie płynu hamulcowego', nameEn: 'Brake fluid flush & bleed', category: 'brakesSuspension' },
  { key: 'brakeLines', namePl: 'Wymiana przewodów hamulcowych', nameEn: 'Brake lines & hoses replacement', category: 'brakesSuspension' },
  { key: 'handbrake', namePl: 'Naprawa hamulca ręcznego / EPB', nameEn: 'Handbrake / EPB repair', category: 'brakesSuspension' },
  { key: 'absEsp', namePl: 'Naprawa układu ABS / ESP i czujników', nameEn: 'ABS / ESP & wheel speed sensors', category: 'brakesSuspension' },
  { key: 'suspension', namePl: 'Przegląd i usuwanie luzów w zawieszeniu', nameEn: 'Suspension inspection & repair', category: 'brakesSuspension' },
  { key: 'shockAbsorbers', namePl: 'Wymiana amortyzatorów i odbojów', nameEn: 'Shock absorbers replacement', category: 'brakesSuspension' },
  { key: 'strutMounts', namePl: 'Wymiana poduszek i łożysk amortyzatorów', nameEn: 'Strut mounts & bearings', category: 'brakesSuspension' },
  { key: 'coilSprings', namePl: 'Wymiana sprężyn zawieszenia', nameEn: 'Coil springs replacement', category: 'brakesSuspension' },
  { key: 'airSuspension', namePl: 'Naprawa zawieszenia pneumatycznego (miechy/kompresor)', nameEn: 'Air suspension repair', category: 'brakesSuspension' },
  { key: 'controlArms', namePl: 'Wymiana wahaczy i tulei metalowo-gumowych', nameEn: 'Control arms & bushings', category: 'brakesSuspension' },
  { key: 'ballJoints', namePl: 'Wymiana sworzni i łączników stabilizatora', nameEn: 'Ball joints & sway bar links', category: 'brakesSuspension' },
  { key: 'rearAxleBeam', namePl: 'Regeneracja tylnej belki skrętnej', nameEn: 'Rear torsion beam refurbishment', category: 'brakesSuspension' },
  { key: 'subframe', namePl: 'Wymiana / regeneracja sanek zawieszenia', nameEn: 'Subframe repair / replacement', category: 'brakesSuspension' },
  { key: 'wheelBearings', namePl: 'Wymiana łożysk i piast kół', nameEn: 'Wheel bearings & hubs', category: 'brakesSuspension' },
  { key: 'tieRods', namePl: 'Wymiana końcówek i drążków kierowniczych', nameEn: 'Tie rods & ends replacement', category: 'brakesSuspension' },
  { key: 'steeringRack', namePl: 'Regeneracja / wymiana maglownicy', nameEn: 'Steering rack repair', category: 'brakesSuspension' },
  { key: 'powerSteering', namePl: 'Naprawa pompy / układu wspomagania', nameEn: 'Power steering pump & system', category: 'brakesSuspension' },
  { key: 'steeringColumn', namePl: 'Naprawa kolumny kierowniczej / krzyżaka', nameEn: 'Steering column & U-joint', category: 'brakesSuspension' },
  { key: 'wheelAlignment', namePl: 'Geometria i zbieżność kół 3D', nameEn: '3D wheel alignment', category: 'brakesSuspension' },

  // Elektryka i klimatyzacja
  { key: 'electrician', namePl: 'Naprawa instalacji elektrycznej i wiązek', nameEn: 'Electrical wiring repair', category: 'electrics' },
  { key: 'parasiticDrain', namePl: 'Diagnostyka poboru prądu na postoju', nameEn: 'Parasitic battery drain diagnosis', category: 'electrics' },
  { key: 'battery', namePl: 'Wymiana i kodowanie akumulatora', nameEn: 'Battery replacement & coding', category: 'electrics' },
  { key: 'alternator', namePl: 'Regeneracja / wymiana alternatora', nameEn: 'Alternator repair / replacement', category: 'electrics' },
  { key: 'starter', namePl: 'Regeneracja / wymiana rozrusznika', nameEn: 'Starter motor repair / replacement', category: 'electrics' },
  { key: 'ignitionCoils', namePl: 'Wymiana cewek i przewodów zapłonowych', nameEn: 'Ignition coils & leads', category: 'electrics' },
  { key: 'crankCamSensor', namePl: 'Wymiana czujnika wału / wałka rozrządu', nameEn: 'Crankshaft / camshaft sensor', category: 'electrics' },
  { key: 'lighting', namePl: 'Naprawa oświetlenia, LED i przetwornic ksenon', nameEn: 'Lighting, LED & xenon ballasts', category: 'electrics' },
  { key: 'headlightAlignment', namePl: 'Ustawienie i regulacja świateł', nameEn: 'Headlight alignment', category: 'electrics' },
  { key: 'wipersSystem', namePl: 'Naprawa wycieraczek, mechanizmu i spryskiwaczy', nameEn: 'Wipers & washer system repair', category: 'electrics' },
  { key: 'parkingSensors', namePl: 'Montaż / naprawa czujników PDC i kamer', nameEn: 'Parking sensors & cameras', category: 'electrics' },
  { key: 'centralLock', namePl: 'Naprawa zamków centralnych i podnośników szyb', nameEn: 'Central locking & window regulators', category: 'electrics' },
  { key: 'mirrorsRepair', namePl: 'Naprawa / wymiana lusterek elektrycznych', nameEn: 'Power mirrors repair', category: 'electrics' },
  { key: 'immobilizer', namePl: 'Diagnostyka immobilisera, stacyjki i kluczyków', nameEn: 'Immobilizer, ignition switch & keys', category: 'electrics' },
  { key: 'ecuBcmRepair', namePl: 'Naprawa / klonowanie sterowników ECU i BCM', nameEn: 'ECU & BCM repair / cloning', category: 'electrics' },
  { key: 'towbarWiring', namePl: 'Montaż haka holowniczego i modułu wiązki', nameEn: 'Towbar & wiring module install', category: 'electrics' },
  { key: 'airConditioning', namePl: 'Serwis i nabijanie klimatyzacji', nameEn: 'A/C recharge & service', category: 'electrics' },
  { key: 'acDisinfection', namePl: 'Odgrzybianie i ozonowanie klimatyzacji', nameEn: 'A/C disinfection & ozone', category: 'electrics' },
  { key: 'acLeakTest', namePl: 'Test szczelności klimatyzacji (azot / UV)', nameEn: 'A/C leak test (nitrogen / UV)', category: 'electrics' },
  { key: 'acCompressor', namePl: 'Wymiana kompresora / sprzęgła klimatyzacji', nameEn: 'A/C compressor & clutch', category: 'electrics' },
  { key: 'acCondenser', namePl: 'Wymiana skraplacza / chłodnicy klimatyzacji', nameEn: 'A/C condenser replacement', category: 'electrics' },
  { key: 'acPipes', namePl: 'Naprawa / spawanie przewodów klimatyzacji', nameEn: 'A/C hoses & pipes repair', category: 'electrics' },
  { key: 'heaterCore', namePl: 'Wymiana nagrzewnicy i dmuchawy nawiewu', nameEn: 'Heater core & blower replacement', category: 'electrics' },
  { key: 'webasto', namePl: 'Serwis i naprawa ogrzewania postojowego Webasto', nameEn: 'Webasto parking heater service', category: 'electrics' },

  // Blacharnia i lakiernia
  { key: 'bodyWork', namePl: 'Naprawy blacharskie powypadkowe', nameEn: 'Collision bodywork repair', category: 'bodyPaint' },
  { key: 'frameStraightening', namePl: 'Prostowanie nadwozia na ramie pomiarowej', nameEn: 'Chassis / frame straightening', category: 'bodyPaint' },
  { key: 'panelReplacement', namePl: 'Wymiana i pasowanie błotnika / drzwi / maski', nameEn: 'Fender, door & hood replacement', category: 'bodyPaint' },
  { key: 'sillsWelding', namePl: 'Spawanie progów, nadkoli i podłogi', nameEn: 'Sills, arches & floor welding', category: 'bodyPaint' },
  { key: 'rustRemoval', namePl: 'Usuwanie korozji i zabezpieczenie antykorozyjne', nameEn: 'Rust removal & anti-corrosion', category: 'bodyPaint' },
  { key: 'underbodyProtection', namePl: 'Konserwacja podwozia i profili zamkniętych', nameEn: 'Underbody & cavity protection', category: 'bodyPaint' },
  { key: 'paint', namePl: 'Lakierowanie elementu nadwozia', nameEn: 'Panel painting', category: 'bodyPaint' },
  { key: 'paintBlending', namePl: 'Lakierowanie z cieniowaniem sąsiednich elementów', nameEn: 'Color blending paintwork', category: 'bodyPaint' },
  { key: 'fullRespray', namePl: 'Lakierowanie całego pojazdu', nameEn: 'Full vehicle respray', category: 'bodyPaint' },
  { key: 'spotRepair', namePl: 'Naprawa lakiernicza SMART / zaprawki', nameEn: 'SMART spot paint repair', category: 'bodyPaint' },
  { key: 'pdrDents', namePl: 'Usuwanie wgnieceń bez lakierowania (PDR)', nameEn: 'Paintless dent repair (PDR)', category: 'bodyPaint' },
  { key: 'paintPolishing', namePl: 'Korekta i polerowanie lakieru', nameEn: 'Paint correction & polishing', category: 'bodyPaint' },
  { key: 'bumperRepair', namePl: 'Spawanie i naprawa zderzaków plastikowych', nameEn: 'Plastic bumper welding & repair', category: 'bodyPaint' },
  { key: 'doorHinges', namePl: 'Regulacja drzwi, klap i wymiana ograniczników', nameEn: 'Door alignment & check straps', category: 'bodyPaint' },

  // Wulkanizacja i opony
  { key: 'tires', namePl: 'Sezonowa wymiana opon (przekładka na felgach)', nameEn: 'Seasonal tire mounting & swap', category: 'tires' },
  { key: 'wheelSwap', namePl: 'Wymiana całych kół z wyważeniem', nameEn: 'Complete wheel swap & balancing', category: 'tires' },
  { key: 'wheelBalancing', namePl: 'Wyważanie kół i test drogowy', nameEn: 'Wheel balancing & road-force', category: 'tires' },
  { key: 'tireRepair', namePl: 'Naprawa przebitej opony (łatka / kołek)', nameEn: 'Puncture repair', category: 'tires' },
  { key: 'tireSidewall', namePl: 'Wulkanizacja na gorąco / naprawa boku opony', nameEn: 'Hot vulcanization / sidewall repair', category: 'tires' },
  { key: 'rimBeadSeal', namePl: 'Uszczelnianie stopki felgi i wymiana wentyli', nameEn: 'Rim bead sealing & valves', category: 'tires' },
  { key: 'rimStraightening', namePl: 'Prostowanie felg aluminiowych i stalowych', nameEn: 'Rim straightening', category: 'tires' },
  { key: 'rimWelding', namePl: 'Spawanie i renowacja / malowanie felg', nameEn: 'Rim welding & refurbishment', category: 'tires' },
  { key: 'tpmsSensors', namePl: 'Programowanie i wymiana czujników TPMS', nameEn: 'TPMS sensors programming', category: 'tires' },
  { key: 'tireStorage', namePl: 'Przechowalnia opon i kół', nameEn: 'Tire & wheel hotel', category: 'tires' },

  // Szyby samochodowe
  { key: 'windows', namePl: 'Wymiana szyby przedniej', nameEn: 'Windshield replacement', category: 'glass' },
  { key: 'adasCalibration', namePl: 'Kalibracja kamery ADAS po wymianie szyby', nameEn: 'ADAS camera calibration', category: 'glass' },
  { key: 'sideRearGlass', namePl: 'Wymiana szyby bocznej lub tylnej', nameEn: 'Side / rear glass replacement', category: 'glass' },
  { key: 'sunroofGlass', namePl: 'Naprawa i wymiana szyberdachu / panoramy', nameEn: 'Sunroof / panoramic glass service', category: 'glass' },
  { key: 'chipRepair', namePl: 'Naprawa odprysków i pajączków na szybie', nameEn: 'Windshield chip repair', category: 'glass' },
  { key: 'glassReseal', namePl: 'Uszczelnianie i ponowne wklejenie szyby', nameEn: 'Glass resealing / re-bonding', category: 'glass' },
  { key: 'rearDefroster', namePl: 'Naprawa ścieżek ogrzewania szyby tylnej', nameEn: 'Rear window defroster repair', category: 'glass' },
  { key: 'windowTinting', namePl: 'Przyciemnianie szyb samochodowych', nameEn: 'Window tinting', category: 'glass' },
  { key: 'glassPolishing', namePl: 'Polerowanie rys na szybach', nameEn: 'Auto glass scratch polishing', category: 'glass' },
  { key: 'headlightPolishing', namePl: 'Polerowanie i zabezpieczenie reflektorów', nameEn: 'Headlight restoration & UV coat', category: 'glass' },

  // Pozostałe
  { key: 'motPrep', namePl: 'Przygotowanie do badania technicznego', nameEn: 'Technical inspection prep', category: 'other' },
  { key: 'lpgService', namePl: 'Serwis instalacji LPG (filtry, regulacja, reduktor)', nameEn: 'LPG system service & tuning', category: 'other' },
  { key: 'interiorDetailing', namePl: 'Czyszczenie, pranie tapicerki i detailing', nameEn: 'Interior detailing & upholstery', category: 'other' },
  { key: 'ceramicCoating', namePl: 'Aplikacja powłoki ceramicznej / wosku', nameEn: 'Ceramic coating & wax', category: 'other' },
  { key: 'other', namePl: 'Inna usługa / wycena indywidualna', nameEn: 'Other / custom request', category: 'other' },
] as const).map((s, order) => ({ ...s, active: true, order, deletedAt: null }))
