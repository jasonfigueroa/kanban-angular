import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, Inject, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CardStatus } from '@app/_enums/card-status';
import { Card } from '@app/_models';
import { CardService } from '@app/_services';

export interface DialogData {
    cardTitle: string;
    cardDescription: string;
}

@Component({
    selector: 'app-kanban-board',
    templateUrl: './kanban-board.component.html',
    styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent implements OnInit {
    loading = false;

    todo: Card[] = [];
    doing: Card[] = [];
    done: Card[] = [];

    constructor(private cardService: CardService,
        public dialog: MatDialog) { }

    ngOnInit(): void {
        this.loading = true;
        
        this.cardService.getAll().subscribe(cards => {
            this.loading = false;
            this.categorizeCards(cards);
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        // if previousValue is defined than this is not the initial load of the cards
        if (changes.cards.previousValue) {
            let cardAFound = false;
            let newCard: Card;

            changes.cards.currentValue.forEach(cardA => {
                cardAFound = false;
                changes.cards.previousValue.forEach(cardB => {
                    if (cardA.id === cardB.id) {
                        cardAFound = true;
                    }
                });
                if (!cardAFound) {
                    newCard = new Card();
                        newCard.id = cardA.id;
                        newCard.title = cardA.title;
                        newCard.description = cardA.description;
                        newCard.status = cardA.status;

                    if (newCard.status === CardStatus.Todo) {
                        this.todo.push(newCard);
                    }
                    else if (newCard.status === CardStatus.Doing) {
                        this.doing.push(newCard);
                    }
                    else if (newCard.status === CardStatus.Done) {
                        this.done.push(newCard);
                    }
                }
            });
        }
    }

    onAddClicked() {
        const dialogRef = this.dialog.open(AddCardDialog, {
            width: '500px',
            data: {cardTitle: '', cardDescription: ''}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (result.cardTitle) {
                    let newCard = new Card({
                        title: result.cardTitle,
                        description: result.cardDescription
                    });
    
                    this.cardService.addCard(newCard).subscribe(card => {
                        this.categorizeCards([card]);
                    });
                }
            }
        });
    }

    onEditClicked(card: Card) {
        const dialogRef = this.dialog.open(AddCardDialog, {
            width: '500px',
            data: {cardTitle: card.title, cardDescription: card.description}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (result.cardTitle !== card.title || result.cardDescription !== card.description) {
                    card.title = result.cardTitle;
                    card.description = result.cardDescription;
    
                    this.cardService.updateCard(card).subscribe(updatedCard => {
                        let cardToUpdateIndex: number;
                        if (updatedCard.status === CardStatus.Todo) {
                            cardToUpdateIndex = this.todo.findIndex(c => {
                                return c.id === updatedCard.id;
                            });
                            Object.assign(this.todo[cardToUpdateIndex], updatedCard);
                        } else if (updatedCard.status === CardStatus.Doing) {
                            cardToUpdateIndex = this.doing.findIndex(c => {
                                return c.id === updatedCard.id;
                            });
                            Object.assign(this.doing[cardToUpdateIndex], updatedCard);
                        } else if (updatedCard.status === CardStatus.Done) {
                            cardToUpdateIndex = this.done.findIndex(c => {
                                return c.id === updatedCard.id;
                            });
                            Object.assign(this.done[cardToUpdateIndex], updatedCard);
                        }
                    });
                }
            }
        });
    }

    onDeleteClicked(card: Card) {
        const dialogRef = this.dialog.open(DeleteCardDialog, {
            width: '500px',
            data: {deleteCard: true}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (result.deleteCard) {
                    this.cardService.deleteCard(card).subscribe(deletedCard => {
                        const deletedCardIndex = this.done.findIndex(c => c.id === deletedCard.id);
                        this.done.splice(deletedCardIndex, 1);
                    });
                }
            }
        });
    }

    drop(event: CdkDragDrop<Card[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            // There has to be a better way to do this
            const movedCardElementId = event.item.element.nativeElement.children[0].children[0].id;
            let movedCardId = movedCardElementId.replace('kanban-card-', '');

            let selectedCard = this.todo.filter(c => {
                return c.id === parseInt(movedCardId)
            })[0];

            if (!selectedCard) {
                selectedCard = this.doing.filter(c => {
                    return c.id === parseInt(movedCardId)
                })[0];
            }

            if (!selectedCard) {
                selectedCard = this.done.filter(c => {
                    return c.id === parseInt(movedCardId)
                })[0];
            }

            // Change card status
            selectedCard.status = this.deriveStatus(event.container.id);
          
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex,
            );
            this.cardService.updateCard(selectedCard).subscribe();
        }
    }

    private categorizeCards(cards: Card[]) {
        cards.forEach(card => {
            if (card.status === CardStatus.Todo) {
                this.todo.push(card);
            }
            else if (card.status === CardStatus.Doing) {
                this.doing.push(card);
            }
            else if (card.status === CardStatus.Done) {
                this.done.push(card);
            }
        });
    }
    
    private deriveStatus(id: string): string {
        let status: string;

        if (id === 'todoDropList') {
            status = CardStatus.Todo;
        } else if (id === 'doingDropList') {
            status = CardStatus.Doing;
        } else {
            status = CardStatus.Done;
        }

        return status;
    }
}

@Component({
    selector: 'add-card-dialog',
    templateUrl: 'add-card-dialog.html',
    styleUrls: ['add-card-dialog.css']
})
export class AddCardDialog {
    constructor(public dialogRef: MatDialogRef<AddCardDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

    onCancelClicked(): void {
        this.dialogRef.close();
    }
}

@Component({
    selector: 'delete-card-dialog',
    templateUrl: 'delete-card-dialog.html'
})
export class DeleteCardDialog {
    constructor(public dialogRef: MatDialogRef<DeleteCardDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

    onCancelClicked(): void {
        this.dialogRef.close();
    }
}
