var transpile = require('../').transpile,
    libutil   = require('util');

[
'{EMPLOYEE} reports to {MANAGER}.',
'{EMPLOYEE} berichtet an {MANAGER}.',
'{COMPANY_COUNT, plural, one {One company} other {# companies}} published new books.',
'{COMPANY_COUNT, plural, one {Eine Firma veröffentlichte} other {# Firmen veröffentlichten}} neue Bücher.',
'{COMPANY_COUNT, plural, one {Одна компания опубликовала} few {# компании опубликовали} many {# компаний опубликовали} other {# компаний опубликовали}} новые книги.',
'{EMPLOYEE} berichtet an {MANAGER}, so dass {MANAGER} {EMPLOYEE} als {EMPLOYEE_GENDER, select, female {direkte Untergebene} other {direkten Untergebenen}} hat.',
'{NAME} est {GENDER, select, female {allée} other {allé}} à {CITY}.',
'{TRAVELLERS} {TRAVELLER_COUNT, plural, one {est {GENDER, select, female {allée} other {allé}}} other {sont {GENDER, select, female {allées} other {allés}}}} à {CITY}.'
].forEach(function (message) {
    console.log(
        JSON.stringify(transpile(message), null, 4)
    );
});
