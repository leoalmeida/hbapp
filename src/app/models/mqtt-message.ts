import {NotificationMessage} from './notification-message';

export interface MqttMessage {
	from: string;
	notification: NotificationMessage;
}
