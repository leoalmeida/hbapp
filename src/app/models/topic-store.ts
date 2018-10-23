import {SubscriptionGrant} from './subscription-grant';
import {Subject} from 'rxjs';

export interface TopicStore<T> {

    grant: SubscriptionGrant;

    stream: Subject<T>;

}