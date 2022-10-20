import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Card } from '@app/_models';

@Component({
    selector: 'app-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
    @Input() card: Card;
    @Output() editButtonClicked: EventEmitter<Card> = new EventEmitter<Card>();
    @Output() deleteButtonClicked: EventEmitter<Card> = new EventEmitter<Card>();

    isActive: boolean;

    constructor() { }

    ngOnInit(): void {
        this.isActive = false;
    }

    onDeleteClicked(card: Card) {
        this.deleteButtonClicked.emit(card);
    }

    onEditClicked(card: Card) {
        this.editButtonClicked.emit(card);
    }
}
