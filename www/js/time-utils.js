class TimeUtils {
    static get now() {
        return moment.tz(window.timeZone)
    }
    static fromUTCMillis(utcMillis) {
        return moment.tz(utcMillis, window.timeZone);
    }
    static toUTCMillis(mom) {
        return mom.valueOf();
    }
}

window.TimeUtils = TimeUtils;
window.timeZone = moment.tz.guess();