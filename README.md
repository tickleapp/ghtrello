github-trello sync tool for Tickle app

# Rules

1. While a new `GitHub issue` created, create corresponding `Trello Card` in `GitHub` list of `Bugs` board.
2. While a `GitHub issue` closed, archive corresponding `Trello Card` which is still in `GitHub` list of `Bugs` board.
3. While a `GitHub issue` closed, move corresponding `Trello Card` to `Ready to Ship` list of `Current Development` board if the card is neither in `GitHub` list of `Bugs` board nor in `Live` board.
4. While a `GitHub issue` reopened, unarchive archived corresponding `Trello Card` back `GitHub` list of `Bugs` board.
5. While a `GitHub issue` reopened, move corresponding `Trello Card` back `GitHub` list of `Bugs` board if it's in `Live` board or in `Ready to Ship` list of `Current Development`.
6. While a `GitHub issue` is marked as resolved, move corresponding `Trello Card` to `QA` list of `Current Development`.
7. While a `GitHub issue` is removed from resolved, move corresponding `Trello Card` to `Next up` list of `Current Development` if it's in `QA` list.
