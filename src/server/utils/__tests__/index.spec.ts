import utils = require('../index');


describe('app', () => {
    it('checking tryValueFromString - should return false when input is \'0|off|<undefined>|<null>|false\'', () => {
        expect(utils.tryValueFromString(undefined)).toBe(false);
        expect(utils.tryValueFromString('0')).toBe(false);
        expect(utils.tryValueFromString('off')).toBe(false);
        expect(utils.tryValueFromString(null)).toBe(false);
        expect(utils.tryValueFromString('false')).toBe(false);
    });
    it('checking tryValueFromString - should return true when any input', () => {
        expect(utils.tryValueFromString('on')).toBe(true);
        expect(utils.tryValueFromString('1')).toBe(true);
        expect(utils.tryValueFromString('anything')).toBe(true);
        expect(utils.tryValueFromString('true')).toBe(true);
    });
});
