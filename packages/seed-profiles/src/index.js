import iphone13Pro from '../profiles/apple_iphone_13_pro.json';
import sonyA7iii from '../profiles/sony_a7iii_2470.json';
import pixel7 from '../profiles/google_pixel_7.json';
import canonR5 from '../profiles/canon_eos_r5.json';
export const SEED_PROFILES = [
    iphone13Pro,
    sonyA7iii,
    pixel7,
    canonR5
];
export function getProfileById(id) {
    return SEED_PROFILES.find(p => p.id === id);
}
//# sourceMappingURL=index.js.map