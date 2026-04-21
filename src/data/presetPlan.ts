import type { Medication } from '../types/domain';

export const presetMedications: Medication[] = [
  {
    id: 'doxycycline',
    name: 'Доксициклин',
    dosage: '100 мг',
    quantity: '1 таб',
    intakeKind: 'tablet',
    withFood: 'after',
    notes: ['Запивать полным стаканом воды', 'Не ложиться 30 минут', 'Не сочетать рядом с молочными'],
    warnings: ['Разносить с железом, магнием, кальцием и антацидами на 2–3 часа'],
    defaultTimes: ['08:00', '20:00'],
    durationDays: 7,
    startDay: 1
  },
  {
    id: 'duphaston',
    name: 'Дюфастон',
    dosage: '10 мг',
    quantity: '1 таб',
    intakeKind: 'tablet',
    withFood: 'any',
    notes: ['Главное — примерно равные интервалы'],
    defaultTimes: ['08:00', '20:00'],
    durationDays: 10,
    startDay: 1
  },
  {
    id: 'tranexam',
    name: 'Транексам',
    dosage: '500 мг',
    quantity: '1 таб',
    intakeKind: 'tablet',
    withFood: 'any',
    notes: ['При чувствительном желудке — лучше после еды'],
    defaultTimes: ['08:00', '15:00', '20:00'],
    durationDays: 3,
    startDay: 1
  },
  {
    id: 'indomethacin',
    name: 'Индометацин',
    dosage: 'свеча',
    quantity: '1 шт',
    intakeKind: 'suppository',
    withFood: 'any',
    notes: ['Удобнее после туалета'],
    defaultTimes: ['20:00'],
    durationDays: 5,
    startDay: 1
  },
  {
    id: 'fluconazole',
    name: 'Флуконазол',
    dosage: '150 мг',
    quantity: '1 капсула',
    intakeKind: 'capsule',
    withFood: 'any',
    notes: ['Прием в 1-й и 4-й день лечения'],
    defaultTimes: ['20:00'],
    specificDays: [1, 4]
  },
  {
    id: 'vitamin-d',
    name: 'Витамин D',
    dosage: '5000 МЕ',
    quantity: '1 капсула',
    intakeKind: 'vitamin',
    withFood: 'during',
    notes: ['Лучше во время еды'],
    defaultTimes: ['08:00'],
    durationDays: 30,
    startDay: 1
  },
  {
    id: 'maxilac',
    name: 'Максилак',
    dosage: '1 капсула',
    quantity: '1 шт',
    intakeKind: 'capsule',
    withFood: 'after',
    notes: ['Удобно после еды'],
    defaultTimes: ['08:00'],
    durationDays: 30
  },
  {
    id: 'clindacin',
    name: 'Клиндацин',
    dosage: '1 свеча',
    quantity: '1 шт',
    intakeKind: 'suppository',
    withFood: 'any',
    notes: ['На ночь'],
    defaultTimes: ['23:00'],
    durationDays: 6
  },
  {
    id: 'acylact',
    name: 'Ацилакт',
    dosage: '1 свеча',
    quantity: '1 шт',
    intakeKind: 'suppository',
    withFood: 'any',
    notes: ['На ночь'],
    defaultTimes: ['23:00'],
    durationDays: 10
  },
  {
    id: 'cyclovita',
    name: 'Цикловита',
    dosage: 'по схеме упаковки',
    quantity: '1 прием',
    intakeKind: 'vitamin',
    withFood: 'during',
    notes: ['С 1 дня месячных', 'Курс 3 месяца'],
    defaultTimes: ['08:00'],
    durationDays: 90
  }
];
