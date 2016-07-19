/**
 * @flow
 */

import moment from 'moment';

export function TimeFormat(time: number, spec: string='YYYY-MM-DD hh:mm:ss'): string{
    return moment(time * 1000).format(spec);
}
