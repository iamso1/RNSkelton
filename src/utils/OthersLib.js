/**
 * @flow
 */
import _ from 'lodash';

 export function randomString(length:number = 10):string{
    $c = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W"
            ,"X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t"
            ,"u","v","w","x","w","z","0","1","2","3","4","5","6","7","8","9"];
    let str = '';
    for(const index=0; index < length; index++){
        str += _.sample($c);
    }
    return str;
}
