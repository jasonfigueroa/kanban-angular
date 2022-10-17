import { CardStatus } from "@app/_enums/card-status";

export class Card {
    id: number;
    title: string;
    description: string;
    status: string;

    public constructor(init?: Partial<Card>) {
        Object.assign(this, init);
    }
}