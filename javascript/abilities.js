"use strict"

var ability_dict = {
	clear: {
		name: "Clear Weather",
		description: "Removes all Weather Cards (Biting Frost, Impenetrable Fog and Torrential Rain) effects. "
	},
	frost: {
		name: "Biting Frost",
		description: "Sets the strength of all Close Combat cards to 1 for both players. "
	},
	fog: {
		name: "Impenetrable Fog",
		description: "Sets the strength of all Ranged Combat cards to 1 for both players. "
	},
	rain: {
		name: "Torrential Rain",
		description: "Sets the strength of all Siege Combat cards to 1 for both players. "
	},
	storm: {
		name: "Skellige Storm",
		description: "Reduces the Strength of all Range and Siege Units to 1. "
	},
	hero: {
		name: "Hero",
		description: "Not affected by any Special Cards or abilities. "
	},
	decoy: {
		name: "Decoy",
		description: "Swap with a card on the battlefield to return it to your hand. "
	},
	developerleader: { //add this to a leader card in cards.js, in ability section to test fast and easy
		description: "Discard 3 cards and draw 3 card of your choice from your deck.",
		activated: async (card) => {
			let deck = board.getRow(card, "deck", card.holder);
			let hand = board.getRow(card, "hand", card.holder);
			
			if (card.holder.controller instanceof ControllerAI) {
				let cards = card.holder.controller.discardOrder(card).splice(0, 2).filter(c => c.basePower < 7);
				await Promise.all(cards.map(async c => await board.toGrave(c, card.holder.hand)));
				card.holder.deck.draw(card.holder.hand);
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
			await ui.queueCarousel(deck, 3, (c,i) => board.toHand(c.cards[i], deck), () => true, true);
			await ui.queueCarousel(hand, 3, (c,i) => board.toGrave(c.cards[i], c), () => true);
			
		},
		weight: (card, ai) => {
			let cards = ai.discardOrder(card).splice(0,2).filter(c => c.basePower < 7);
			if (cards.length < 2) return 0;
			return cards[0].abilities.includes("muster") ? 50 : 25;
		}
	},
	
	
	
	//TESTING SECTION delete once done with testing
	//delete everything DWON from "delete down" and everything UP from delete up
	//delete down	











	//delete up






























	//TO DO SECTION down
	//here are all abilities listed and they appear on the cards with proper description and icons but they do nothing at the moment and they need to be implemented


	//UNITS !!
	HighestBackToDeck :{ //new monster printed card from printed version
		name: "HighestBackToDeck",
		description: "Return both player's highest unit on the board back to their decks (if there is a draw between units, it is a random decision)",
		},	
	
	CancleOneActiveWeatherCard:{//triss wweather universal card from printed version
		name: "CancleOneActiveWeatherCard",
		description: "Cancel the effect of 1 active weather card.",
	},
	sacrifice : {
		name:"sacrifice",//Sabrina Sacrifice universal card from printed version
		description:"Target your unit, move it to graveyard, this card will take its place.",
	},
	



	//LEADERS !!
	





	//TO DO SECTION up









	horn: {
		name: "Commander's Horn",
		description: "Doubles the strength of all unit cards in that row. Limited to 1 per row. ",
		placed: async card => await card.animate("horn")
	},
	mardroeme: {
		name: "Mardroeme",
		description: "Triggers transformation of all Berserker cards on the same row. ",
		placed: async (card, row) => {
			if (card.isLocked()) return;
			let berserkers = row.findCards(c => c.abilities.includes("berserker"));
			await Promise.all(berserkers.map(async c => await ability_dict["berserker"].placed(c, row)));
		}
	},
	berserker: {
		name: "Berserker",
		description: "Transforms into a bear when a Mardroeme card is on its row. ",
		placed: async (card, row) => {
			if (row.effects.mardroeme === 0 || card.isLocked()) return;
			row.removeCard(card);
			await row.addCard(new Card(card.target, card_dict[card.target], card.holder));
		}
	},
	scorch: {
		name: "Scorch",
		description: "Discard after playing. Kills the strongest card(s) on the battlefield. ",
		activated: async card => {	
			await ability_dict["scorch"].placed(card);
			await board.toGrave(card, card.holder.hand);
		},
		placed: async (card, row) => {
			if (card.isLocked() || game.scorchCancelled) return;
			if (row !== undefined) row.cards.splice(row.cards.indexOf(card), 1);
			let maxUnits = board.row.map(r => [r, r.maxUnits()]).filter(p => p[1].length > 0).filter(p => !p[0].isShielded());
			if (row !== undefined) row.cards.push(card);
			let maxPower = maxUnits.reduce((a,p) => Math.max(a, p[1][0].power), 0);
			let scorched = maxUnits.filter(p => p[1][0].power === maxPower);
			let cards = scorched.reduce((a, p) => a.concat(p[1].map(u => [p[0], u])), []);
			await Promise.all(cards.map(async u => await u[1].animate("scorch", true, false)));
			await Promise.all(cards.map(async u => await board.toGrave(u[1], u[0])));
		}
	},
	scorchmin: {
		name: "scorchmin",
		description: "Kills the weakest card(s) on the battlefield.(can not target himself) ",
		activated: async card => {
			await ability_dict["scorch"].placed(card);
			await board.toGrave(card, card.holder.hand);
		},
		placed: async (card, row) => {
			if (card.isLocked() || game.scorchCancelled) return;
			if (row !== undefined) row.cards.splice(row.cards.indexOf(card), 1);
			let minUnits = board.row.map(r => [r, r.minUnits()]).filter(p => p[1].length > 0).filter(p => !p[0].isShielded());
			if (row !== undefined) row.cards.push(card);
			let minPower = minUnits.reduce((a, p) => Math.min(a, p[1][0].power), Infinity); // Changed Math.max to Math.min
			let scorched = minUnits.filter(p => p[1][0].power === minPower); // Changed max to min
			let cards = scorched.reduce((a, p) => a.concat(p[1].map(u => [p[0], u])), []);
			await Promise.all(cards.map(async u => await u[1].animate("scorch", true, false)));
			await Promise.all(cards.map(async u => await board.toGrave(u[1], u[0])));
		}
	},
	scorch_c: {
		name: "Scorch - Close Combat",
		description: "Destroy your enemy's strongest Close Combat unit(s) if the combined strength of all his or her Close Combat units is 10 or more. ",
		placed: async (card) => await board.getRow(card, "close", card.holder.opponent()).scorch()
	},
	scorch_r: {
		name: "Scorch - Ranged",
		description: "Destroy your enemy's strongest Ranged Combat unit(s) if the combined strength of all his or her Ranged Combat units is 10 or more. ",
		placed: async (card) => await board.getRow(card, "ranged", card.holder.opponent()).scorch()
	},
	scorch_s: {
		name: "Scorch - Siege",
		description: "Destroys your enemy's strongest Siege Combat unit(s) if the combined strength of all his or her Siege Combat units is 10 or more. ",
		placed: async (card) => await board.getRow(card, "siege", card.holder.opponent()).scorch()
	},
	agile: {
		name:"Agile", 
		description: "Can be placed in either the Close Combat or the Ranged Combat row. Cannot be moved once placed. "
	},
	destroy1weakest: {
		name: "destroy1weakest",
		description: "Destroy only 1 weakest unit on the opposite row",
		placed: async card => {
			let row = card.currentLocation.getOppositeRow();
			if (row.isShielded() || game.scorchCancelled) return;
			let units = row.minUnits();
	
			// Find the weakest unit
			let weakestUnit = units.reduce((minUnit, currentUnit) => {
				return currentUnit.power < minUnit.power ? currentUnit : minUnit;
			});
	
			// Destroy the weakest unit
			await weakestUnit.animate("scorch", true, false);
			await board.toGrave(weakestUnit, row);
		}
	},
	muster: {
		name:"Muster", 
		description: "Find any cards with the same name in your deck and play them instantly. ",
		placed: async (card) => {
			if (card.isLocked()) return;
			let pred = c => c.target === card.target;
			let units = card.holder.hand.getCards(pred).map(x => [card.holder.hand, x])
				.concat(card.holder.deck.getCards(pred).map(x => [card.holder.deck, x]));
			if (units.length === 0) return;
			await card.animate("muster");
			if (card.row === "agile") await Promise.all(units.map(async p => await board.addCardToRow(p[1], card.currentLocation, p[1].holder, p[0])));
			else await Promise.all(units.map(async p => await board.addCardToRow(p[1], p[1].row, p[1].holder, p[0])));
		}
	},
	spy: {
		name: "Spy",
		description: "Place on your opponent's battlefield (counts towards your opponent's total) and draw 2 cards from your deck. ",
		placed: async (card) => {
			if (card.isLocked()) return;
			await card.animate("spy");
			for (let i = 0; i < 1; i++) { //ABILITY1 change this from "i < 3" to "i < 1" once done testing
				if (card.holder.deck.cards.length > 0) await card.holder.deck.draw(card.holder.hand);
			}
			card.holder = card.holder.opponent();
		}
	},
	play_cow: {
		name: "play_cow",
		description: "Pick Cow card from your deck or graveyard and play it instantly.",
		placed: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Cow");
			if (out) {
				await out.autoplay(card.holder.deck);
			} else {
				// If "Cow" card is not found in deck, try to find and autoplay it from the graveyard
				out = card.holder.grave.findCard(c => c.name === "Cow");
				if (out) {
					await out.autoplay(card.holder.grave);
				} else {
					console.log("Cow card not found in deck or graveyard."); // Add error handling if needed
				}
			}
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "Cow")
	},
	draw2discard2: { //Draw 2 random cards from your deck to your hand, then move 2 cards of your choice from hand to your graveyard 
		name: "Draw 2 Discard 2",
		description: "Draw 2 random cards from your deck to your hand, then move 2 cards of your choice from hand to your graveyard",
		placed: async (card) => {
			if (card.isLocked()) return;
			await card.animate("spy");
			let hand = card.holder.hand;
			let deck = card.holder.deck;
			
			// Draw 2 random cards from deck to hand
			for (let i = 0; i < 2; i++) {
				if (deck.cards.length > 0) await deck.draw(hand);
			}
	
			// Prompt player to choose 2 cards from hand to move to graveyard
			if (card.holder.controller instanceof ControllerAI) {
				let cardsToDiscard = card.holder.controller.discardOrder(card).splice(0, 2);
				await Promise.all(cardsToDiscard.map(async c => await board.toGrave(c, hand)));
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
			await ui.queueCarousel(hand, 2, (c,i) => board.toGrave(c.cards[i], c), () => true);
		}
	},
	draw3discard3: { //Draw 3 random to hand, then discard 3 of your choice from hand to your graveyard 
		name: "Draw 3 Discard 3",
		description: "Draw 3 random cards from your deck to your hand, then move 3 cards of your choice from hand to your graveyard.",
		placed: async (card) => {
			if (card.isLocked()) return;
			await card.animate("spy");
			let hand = card.holder.hand;
			let deck = card.holder.deck;
			
			// Draw 2 random cards from deck to hand
			for (let i = 0; i < 3; i++) {
				if (deck.cards.length > 0) await deck.draw(hand);
			}
	
			// Prompt player to choose 2 cards from hand to move to graveyard
			if (card.holder.controller instanceof ControllerAI) {
				let cardsToDiscard = card.holder.controller.discardOrder(card).splice(0, 3);
				await Promise.all(cardsToDiscard.map(async c => await board.toGrave(c, hand)));
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
			await ui.queueCarousel(hand, 3, (c,i) => board.toGrave(c.cards[i], c), () => true);
		}
	},
	medic: {
		name: "Medic",
		description: "Choose one card from your discard pile and play it instantly (no Heroes or Special Cards). ",
		placed: async (card) => {
			if (card.isLocked() || (card.holder.grave.findCards(c => c.isUnit()) <= 0)) return;
			let grave = board.getRow(card, "grave", card.holder);
			let respawns = [];
			if (game.randomRespawn) {
				for (var i = 0; i < game.medicCount; i++) {
					if (card.holder.grave.findCards(c => c.isUnit()).length > 0) {
						let res = grave.findCardsRandom(c => c.isUnit())[0];
						grave.removeCard(res);
						grave.addCard(res);
						await res.animate("medic");
						await res.autoplay(grave);
					}
				}
				return;
			} else if (card.holder.controller instanceof ControllerAI) {
				for (var i = 0; i < game.medicCount; i++) {
					if (card.holder.grave.findCards(c => c.isUnit()).length > 0) {
						let res = card.holder.controller.medic(card, grave);
						grave.removeCard(res);
						grave.addCard(res);
						await res.animate("medic");
						await res.autoplay(grave);
					}
				}
				return;
			}
			await ui.queueCarousel(card.holder.grave, game.medicCount, (c, i) => respawns.push({ card: c.cards[i] }), c => c.isUnit(), true);
			await Promise.all(respawns.map(async wrapper => {
				let res = wrapper.card;
				grave.removeCard(res);
				grave.addCard(res);
				await res.animate("medic");
				await res.autoplay(grave);
			}));
		}
	},
	morale: {
		name: "Morale Boost",
		description: "Adds +1 to all units in the row (excluding itself). ",
		placed: async card => await card.animate("morale")
	},
	bond: {
		name: "Tight Bond",
		description: "Place next to a card with the same name to double the strength of both cards. ",
		placed: async card => {
			if (card.isLocked()) return;
			let bonds = card.currentLocation.findCards(c => c.target === card.target).filter(c => c.abilities.includes("bond")).filter(c => !c.isLocked());
			if (bonds.length > 1) await Promise.all(bonds.map(c => c.animate("bond")));
		}
	},
	avenger: {
		name: "Avenger",
		description: "When this card is removed from the battlefield, it summons a powerful new Unit Card to take its place. ",
		removed: async (card) => {
			if (game.over || game.roundHistory.length > 2 || card.isLocked()) return;
			if (card_dict[card.target]["ability"].includes("muster") && (card.holder.deck.findCards(c => c.key === card.target).length === 0 && card.holder.hand.findCards(c => c.key === card.target).length === 0)) {
				for (let i = 0; i < card_dict[card.target]["count"]; i++) {
					let avenger = new Card(card.target, card_dict[card.target], card.holder);
					avenger.removed.push(() => setTimeout(() => avenger.holder.grave.removeCard(avenger), 2000));
					if (card.target != card.key) await board.addCardToRow(avenger, avenger.row, card.holder);
				}
			} else if (card.target === card.key) await board.moveTo(card, card.row, card.holder.grave);
			else {
				let avenger;
				if (card.holder.deck.findCards(c => c.key === card.target).length) {
					avenger = card.holder.deck.findCard(c => c.key === card.target);
					await board.moveTo(avenger, avenger.row, card.holder.deck);
				} else if (card.holder.hand.findCards(c => c.key === card.target).length) {
					avenger = card.holder.hand.findCard(c => c.key === card.target);
					await board.moveTo(avenger, avenger.row, card.holder.hand);
				} else {
					avenger = new Card(card.target, card_dict[card.target], card.holder);
					await board.addCardToRow(avenger, avenger.row, card.holder);
					if (card.target != card.key) avenger.removed.push(() => setTimeout(() => avenger.holder.grave.removeCard(avenger), 2000));
				}
			}
		},
		weight: (card) => {
			if (game.roundHistory.length > 2) return 1;
			return Number(card_dict[card.target]["strength"]);
		}
	},
	cintra_slaughter: {
		name: "Slaughter of Cintra",
		description: "When using the Slaugther of Cintra special card, destroy all units on your side of the board having the Slaughter of Cintra ability then draw as many cards as units destroyed.",
		activated: async card => {
			let targets = board.row.map(r => [r, r.findCards(c => c.abilities.includes("cintra_slaughter")).filter(c => c.holder === card.holder).filter(c => !c.isLocked())]);
			let cards = targets.reduce((a, p) => a.concat(p[1].map(u => [p[0], u])), []);
			let nb_draw = cards.length;
			await Promise.all(cards.map(async u => await u[1].animate("scorch", true, false)));
			await Promise.all(cards.map(async u => await board.toGrave(u[1], u[0])));
			await board.toGrave(card, card.holder.hand);
			for (let i = 0; i < nb_draw; i++) {
				if (card.holder.deck.cards.length > 0) await card.holder.deck.draw(card.holder.hand);
			}
		},
		weight: (card) => 30
	},
	foltest_king: {
		description: "Pick an Impenetrable Fog card from your deck and play it instantly.",
		activated: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Impenetrable Fog");
			if (out) await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "fog")
	},
	foltest_lord: {
		description: "Clear any weather effects (resulting from Biting Frost, Torrential Rain or Impenetrable Fog cards) in play.",
		activated: async () => {
			tocar("clear", false);
			await weather.clearWeather()
		},
		weight: (card, ai) =>  ai.weightCard(card_dict["spe_clear"])
	},
	foltest_siegemaster: {
		description: "Doubles the strength of all your Siege units (unless a Commander's Horn is also present on that row).",
		activated: async card => await board.getRow(card, "siege", card.holder).leaderHorn(card),
		weight: (card, ai) => ai.weightHornRow(card, board.getRow(card, "siege", card.holder))
	},
	foltest_steelforged: {
		description: "Destroy your enemy's strongest Siege unit(s) if the combined strength of all his or her Siege units is 10 or more.",
		activated: async card => await ability_dict["scorch_s"].placed(card),
		weight: (card, ai, max) => ai.weightScorchRow(card, max, "siege")
	},
	foltest_son: {
		description: "Destroy your enemy's strongest Ranged Combat unit(s) if the combined strength of all his or her Ranged Combat units is 10 or more.",
		activated: async card => await ability_dict["scorch_r"].placed(card),
		weight: (card, ai, max) => ai.weightScorchRow(card, max, "ranged")
	},
	emhyr_imperial: {
		description: "Pick a Torrential Rain card from your deck and play it instantly.",
		activated: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Torrential Rain");
			if (out) await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "rain")
	},
	play_rain: { // ABILITY1 Play rain from your deck
		play_rain: "play_rain",
		description: "Pick a Torrential Rain card from your deck and play it instantly.",
		placed: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Torrential Rain");
			if (out) await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "rain")
	},
	play_frost: { // ABILITY1 Play frost from your deck
		play_frost: "play_frost",
		description: "Pick a Biting Frost card from your deck and play it instantly.",
		placed: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Biting Frost");
			if (out) await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "frost")
	},
	play_fog: { // ABILITY1 Play frost from your deck
		play_fog: "play_fog",
		description: "Pick a Biting Frost card from your deck and play it instantly.",
		placed: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Impenetrable Fog");
			if (out) await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "fog")
	},
	emhyr_emperor: {
		description: "Look at 3 random cards from your opponent's hand.",
		activated: async card => {
			if (card.holder.controller instanceof ControllerAI) return;
			let container = new CardContainer();
			container.cards = card.holder.opponent().hand.findCardsRandom(() => true, 3);
			try {
				Carousel.curr.cancel();
			} catch (err) {}
			await ui.viewCardsInContainer(container);
		},
		weight: card => {
			let count = card.holder.opponent().hand.cards.length;
			return count === 0 ? 0 : Math.max(10, 10 * (8 - count));
		}
	},
	reveal3: {
		reveal3: "reveal3",
		description: "Permanantly reveal 3 random cards from your opponent's hand.",
		placed: async card => {
			if (card.holder.controller instanceof ControllerAI) return;
			let container = new CardContainer();
			container.cards = card.holder.opponent().hand.findCardsRandom(() => true, 3);
			try {
				Carousel.curr.cancel();
			} catch (err) {}
			await ui.viewCardsInContainer(container);
		},
		weight: card => {
			let count = card.holder.opponent().hand.cards.length;
			return count === 0 ? 0 : Math.max(10, 10 * (8 - count));
		}
	},
	emhyr_whiteflame: {
		description: "Cancel your opponent's Leader Ability."
	},
	emhyr_relentless: {
		description: "Draw a card from your opponent's discard pile.",
		activated: async card => {
			let grave = board.getRow(card, "grave", card.holder.opponent());
			if (grave.findCards(c => c.isUnit()).length === 0) return;
			if (card.holder.controller instanceof ControllerAI) {
				let newCard = card.holder.controller.medic(card, grave);
				newCard.holder = card.holder;
				await board.toHand(newCard, grave);
				return;
			}
			try {
				Carousel.curr.cancel();
			} catch (err) {}
			await ui.queueCarousel(grave, 1, (c,i) => {
				let newCard = c.cards[i];
				newCard.holder = card.holder;
				board.toHand(newCard, grave);
			}, c => c.isUnit(), true);
		},
		weight: (card, ai, max, data) => ai.weightMedic(data, 0, card.holder.opponent())
	},
	
	gravetograve1: { //Choose 1 of opponents unit cards in his graveyard, and move it to yours bloody baron 
		description: "Move 2 units of your choice, from your opponent's graveyard, to your graveyard.",
		placed: async card => {
			let grave = board.getRow(card, "grave", card.holder.opponent());
			if (grave.findCards(c => c.isUnit()).length === 0) return;
			if (card.holder.controller instanceof ControllerAI) {
				let newCard = card.holder.controller.medic(card, grave);
				newCard.holder = card.holder;
				await board.toGrave(newCard, grave);
				return;
			}
			try {
				Carousel.curr.cancel();
			} catch (err) {}
			await ui.queueCarousel(grave, 2, (c,i) => {
				let newCard = c.cards[i];
				newCard.holder = card.holder;
				board.toGrave(newCard, grave);
			}, c => c.isUnit(), true);
		},
		weight: (card, ai, max, data) => ai.weightMedic(data, 0, card.holder.opponent())
	},	
		
	emhyr_invader: {
		description: "Abilities that restore a unit to the battlefield restore a randomly-chosen unit. Affects both players.",
		gameStart: () => game.randomRespawn = true
	},
	eredin_commander: {
		description: "Double the strength of all your Close Combat units (unless a Commander's horn is 	also present on that row).",
		activated: async card => await board.getRow(card, "close", card.holder).leaderHorn(card),
		weight: (card, ai) => ai.weightHornRow(card, board.getRow(card, "close", card.holder))
	},
	eredin_bringer_of_death: {
		name: "Eredin : Bringer of Death",
		description: "Restore a card from your discard pile to your hand.",
		activated: async card => {
			let newCard;
			if (card.holder.controller instanceof ControllerAI) newCard = card.holder.controller.medic(card, card.holder.grave);
			else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
				await ui.queueCarousel(card.holder.grave, 1, (c,i) => newCard = c.cards[i], c => c.isUnit(), false, false);
			}
			if (newCard) await board.toHand(newCard, card.holder.grave);
		},
		weight: (card, ai, max, data) => ai.weightMedic(data, 0, card.holder)
	},
	eredin_destroyer: {
		description: "Discard 1 card and draw 1 card of your choice from your deck.",
		activated: async (card) => {
			let hand = board.getRow(card, "hand", card.holder);
			let deck = board.getRow(card, "deck", card.holder);
			if (card.holder.controller instanceof ControllerAI) {
				let cards = card.holder.controller.discardOrder(card).splice(0, 2).filter(c => c.basePower < 7);
				await Promise.all(cards.map(async c => await board.toGrave(c, card.holder.hand)));
				card.holder.deck.draw(card.holder.hand);
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
			await ui.queueCarousel(hand, 1, (c,i) => board.toGrave(c.cards[i], c), () => true);
			await ui.queueCarousel(deck, 1, (c,i) => board.toHand(c.cards[i], deck), () => true, true);
		},
		weight: (card, ai) => {
			let cards = ai.discardOrder(card).splice(0,2).filter(c => c.basePower < 7);
			if (cards.length < 2) return 0;
			return cards[0].abilities.includes("muster") ? 50 : 25;
		}
	},	
	
	eredin_king: {
		description: "Pick any weather card from your deck and play it instantly.",
		activated: async card => {
			let deck = board.getRow(card, "deck", card.holder);
			if (card.holder.controller instanceof ControllerAI) await ability_dict["eredin_king"].helper(card).card.autoplay(card.holder.deck);
			else {
				try {
					Carousel.curr.cancel();
				} catch (err) { }
				await ui.queueCarousel(deck, 1, (c,i) => board.toWeather(c.cards[i], deck), c => c.faction === "weather", true);
			}
		},
		weight: (card, ai, max) => ability_dict["eredin_king"].helper(card).weight,
		helper: card => {
			let weather = card.holder.deck.cards.filter(c => c.row === "weather").reduce((a,c) => a.map(c => c.name).includes(c.name) ? a : a.concat([c]), []);
			let out, weight = -1;
			weather.forEach(c => {
				let w = card.holder.controller.weightWeatherFromDeck(c, c.abilities[0]);
				if (w > weight) {
					weight = w;
					out = c;
				}
			});
			return {
				card: out,
				weight: weight
			};
		}
	},
	anyweather: {
		anyweather: "anyweather",
		description: "Pick any weather card from your deck and play it instantly.",
		placed: async card => {
			let deck = board.getRow(card, "deck", card.holder);
			if (card.holder.controller instanceof ControllerAI) await ability_dict["anyweather"].helper(card).card.autoplay(card.holder.deck);
			else {
				try {
					Carousel.curr.cancel();
				} catch (err) { }
				await ui.queueCarousel(deck, 1, (c,i) => board.toWeather(c.cards[i], deck), c => c.faction === "weather", true);
			}
		},
		weight: (card, ai, max) => ability_dict["anyweather"].helper(card).weight,
		helper: card => {
			let weather = card.holder.deck.cards.filter(c => c.row === "weather").reduce((a,c) => a.map(c => c.name).includes(c.name) ? a : a.concat([c]), []);
			let out, weight = -1;
			weather.forEach(c => {
				let w = card.holder.controller.weightWeatherFromDeck(c, c.abilities[0]);
				if (w > weight) {
					weight = w;
					out = c;
				}
			});
			return {
				card: out,
				weight: weight
			};
		}
	},
	anyweathertospecial: {
		anyweathertospecial: "anyweathertospecial",
		description: "Pick any special non weather card from your deck and play it instantly.",
		placed: async card => {
			let deck = board.getRow(card, "deck", card.holder);
			if (card.holder.controller instanceof ControllerAI) await ability_dict["anyspecial"].helper(card).card.autoplay(card.holder.deck);
			else {
				try {
					Carousel.curr.cancel();
				} catch (err) { }
				await ui.queueCarousel(deck, 1, (c,i) => board.autoplay(c.cards[i], deck), c => c.faction === "special", true);
			}
		},
		weight: (card, ai, max) => ability_dict["anyspecial"].helper(card).weight,
		helper: card => {
			let special = card.holder.deck.cards.filter(c => c.row === "special").reduce((a,c) => a.map(c => c.name).includes(c.name) ? a : a.concat([c]), []);
			let out, weight = -1;
			special.forEach(c => {
				let w = card.holder.controller.weightSpecialFromDeck(c, c.abilities[0]);
				if (w > weight) {
					weight = w;
					out = c;
				}
			});
			return {
				card: out,
				weight: weight
			};
		}
	},	
	eredin_treacherous: {
		description: "Doubles the strength of all spy cards (affects both players).", //should be 15 strenght with no ability 
		gameStart: () => game.spyPowerMult = 2
	},
	francesca_queen: {
		description: "Destroy your enemy's strongest Close Combat unit(s) if the combined strength of all his or her Close Combat units is 10 or more.",
		activated: async card => await ability_dict["scorch_c"].placed(card),
		weight: (card, ai, max) => ai.weightScorchRow(card, max, "close")
	},
	francesca_beautiful: {
		description: "Doubles the strength of all your Ranged Combat units (unless a Commander's Horn is also present on that row).",
		activated: async card => await board.getRow(card, "ranged", card.holder).leaderHorn(card),
		weight: (card, ai) => ai.weightHornRow(card, board.getRow(card, "ranged", card.holder))
	},
	francesca_daisy: {
		description: "Draw an extra card at the beginning of the battle.",//play scorch from your deck
		placed: card => game.gameStart.push(() => {
			let draw = card.holder.deck.removeCard(0);
			card.holder.hand.addCard(draw);
			return true;
		})
	},
	francesca_pureblood: {
		description: "Pick a Biting Frost card from your deck and play it instantly.",
		activated: async card => {
			let out = card.holder.deck.findCard(c => c.name === "Biting Frost");
			if (out) await out.autoplay(card.holder.deck);
		},
		weight: (card, ai) => ai.weightWeatherFromDeck(card, "frost")
	},
	francesca_hope: {
		description: "Move agile units to whichever valid row maximizes their strength (don't move units already in optimal row).",
		activated: async card => {
			let close = board.getRow(card, "close");
			let ranged =  board.getRow(card, "ranged");
			let cards = ability_dict["francesca_hope"].helper(card);
			await Promise.all(cards.map(async p => await board.moveTo(p.card, p.row === close ? ranged : close, p.row)));
		},
		weight: card => {
			let cards = ability_dict["francesca_hope"].helper(card);
			return cards.reduce((a,c) => a + c.weight, 0);
		},
		helper: card => {
			let close = board.getRow(card, "close");
			let ranged = board.getRow(card, "ranged");
			return validCards(close).concat(validCards(ranged));
			
			function validCards(cont) {
				return cont.findCards(c => c.row === "agile").filter(c => dif(c,cont) > 0).map(c => ({
					card:c, row:cont, weight:dif(c,cont)
				}))
			}
			
			function dif(card, source) {
				return (source === close ? ranged : close).calcCardScore(card) - card.power;
			}
		}
	},
	crach_an_craite: {
		description: "Shuffle all cards from each player's graveyard back into their decks.",
		activated: async card => {
			Promise.all(card.holder.grave.cards.map(c => board.toDeck(c, card.holder.grave)));
			await Promise.all(card.holder.opponent().grave.cards.map(c => board.toDeck(c, card.holder.opponent().grave)));
		},
		weight: (card, ai, max, data) => {
			if (game.roundCount < 2) return 0;
			let medics = card.holder.hand.findCard(c => c.abilities.includes("medic"));
			if (medics !== undefined) return 0;
			let spies = card.holder.hand.findCard(c => c.abilities.includes("spy"));
			if (spies !== undefined) return 0;
			if (card.holder.hand.findCard(c => c.abilities.includes("decoy")) !== undefined && (data.medic.length || data.spy.length && card.holder.deck.findCard(c => c.abilities.includes("medic")) !== undefined)) return 0;
			return 15;
		}
	},
	king_bran: {
		description: "Units only lose half their Strength in bad weather conditions.",
		placed: card => {
			for (var i = 0; i < board.row.length; i++) {
				if ((card.holder === player_me && i > 2) || (card.holder === player_op && i < 3)) board.row[i].halfWeather = true;
			}
		}
	},
	queen_calanthe: {
		description: "Play a unit then draw a card from you deck.",
		activated: async card => {
			let units = card.holder.hand.cards.filter(c => c.isUnit());
			if (units.length === 0) return;
			let wrapper = {
				card: null
			};
			if (card.holder.controller instanceof ControllerAI) wrapper.card = units[randomInt(units.length)];
			else await ui.queueCarousel(board.getRow(card, "hand", card.holder), 1, (c, i) => wrapper.card = c.cards[i], c => c.isUnit(), true);
			wrapper.card.autoplay();
			card.holder.hand.removeCard(wrapper.card);
			if (card.holder.deck.cards.length > 0) await card.holder.deck.draw(card.holder.hand);
		},
		weight: (card, ai) => {
			let units = card.holder.hand.cards.filter(c => c.isUnit());
			if (units.length === 0) return 0;
			return 15;
		}
	},
	playunit_drawcard: { //cantarela from nilfgard card
		playunit_drawcard: "playunit_drawcard",
		description: "Play a unit then draw a random card from you deck.",
		placed: async card => {
			let units = card.holder.hand.cards.filter(c => c.isUnit());
			if (units.length === 0) return;
			let wrapper = {
				card: null
			};
			if (card.holder.controller instanceof ControllerAI) wrapper.card = units[randomInt(units.length)];
			else await ui.queueCarousel(board.getRow(card, "hand", card.holder), 1, (c, i) => wrapper.card = c.cards[i], c => c.isUnit(), true);
			wrapper.card.autoplay();
			card.holder.hand.removeCard(wrapper.card);
			if (card.holder.deck.cards.length > 0) await card.holder.deck.draw(card.holder.hand);
		},
		weight: (card, ai) => {
			let units = card.holder.hand.cards.filter(c => c.isUnit());
			if (units.length === 0) return 0;
			return 15;
		}
	},	
	fake_ciri: {
		description: "Discard a card from your hand and then draw two cards from your deck.",
		activated: async card => {
			if (card.holder.hand.cards.length === 0) return;
			let hand = board.getRow(card, "hand", card.holder);
			if (card.holder.controller instanceof ControllerAI) {
				let cards = card.holder.controller.discardOrder(card).splice(0, 1).filter(c => c.basePower < 7);
				await Promise.all(cards.map(async c => await board.toGrave(c, card.holder.hand)));
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
				await ui.queueCarousel(hand, 1, (c, i) => board.toGrave(c.cards[i], c), () => true);
			}
			for (let i = 0; i < 2; i++) {
				if (card.holder.deck.cards.length > 0) await card.holder.deck.draw(card.holder.hand);
			}
		},
		weight: (card, ai) => {
			if (card.holder.hand.cards.length === 0) return 0;
			return 15;
		}
	},
	radovid_stern: {
		description: "Discard 2 cards and draw 1 card of your choice from your deck.",
		activated: async (card) => {
			let hand = board.getRow(card, "hand", card.holder);
			let deck = board.getRow(card, "deck", card.holder);
			if (card.holder.controller instanceof ControllerAI) {
				let cards = card.holder.controller.discardOrder(card).splice(0, 2).filter(c => c.basePower < 7);
				await Promise.all(cards.map(async c => await board.toGrave(c, card.holder.hand)));
				card.holder.deck.draw(card.holder.hand);
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
			await ui.queueCarousel(hand, 2, (c, i) => board.toGrave(c.cards[i], c), () => true);
			await ui.queueCarousel(deck, 1, (c, i) => board.toHand(c.cards[i], deck), () => true, true);
		},
		weight: (card, ai) => {
			let cards = ai.discardOrder(card).splice(0, 2).filter(c => c.basePower < 7);
			if (cards.length < 2) return 0;
			return cards[0].abilities.includes("muster") ? 50 : 25;
		}
	},
	radovid_ruthless: {
		description: "Cancel ALL scorching ability's for one round",
		activated: async card => {
			game.scorchCancelled = true;
			await ui.notification("north-scorch-cancelled", 1200);
			game.roundStart.push(async () => {
				game.scorchCancelled = false;
				return true;
			});
		}
	},
	vilgefortz_magician_kovir: {
		description: "Halves the strength of all spy cards (affects both players).",
		gameStart: () => game.spyPowerMult = 0.5
	},
	cosimo_malaspina: {
		description: "Destroy your enemy's strongest Melee unit(s) if the combined strength of all his or her Melee units is 10 or more.",
		activated: async card => await ability_dict["scorch_c"].placed(card),
		weight: (card, ai, max) => ai.weightScorchRow(card, max, "close")
	},
	resilience: {
		name: "Resilience",
		description: "Remains on the board for the following round if another unit on your side of the board had an ability in common.",
		placed: async card => {
			game.roundEnd.push(async () => {
				if (card.isLocked()) return;
				let units = card.holder.getAllRowCards().filter(c => c.abilities.includes(card.abilities.at(-1)));
				if (units.length < 2) return;
				card.noRemove = true;
				await card.animate("resilience");
				game.roundStart.push(async () => {
					delete card.noRemove;
					let school = card.abilities.at(-1);
					if (!card.holder.effects["witchers"][school]) card.holder.effects["witchers"][school] = 0;
					card.holder.effects["witchers"][school]++;
					return true;
				});
			});
		}
	},
	witcher_wolf_school: {
		name: "Wolf School of Witchers",
		description: "Each unit of this witcher school is boosted by 2 for each card of this given school.",
		placed: async card => {
			let school = card.abilities.at(-1);
			if (!card.holder.effects["witchers"][school]) card.holder.effects["witchers"][school] = 0;
			card.holder.effects["witchers"][school]++;
		},
		removed: async card => {
			let school = card.abilities.at(-1);
			card.holder.effects["witchers"][school]--;
		}
	},
	witcher_viper_school: {
		name: "Viper School of Witchers",
		description: "Each unit of this witcher school is boosted by 2 for each card of this given school.",
		placed: async card => {
			let school = card.abilities.at(-1);
			if (!card.holder.effects["witchers"][school]) card.holder.effects["witchers"][school] = 0;
			card.holder.effects["witchers"][school]++;
		},
		removed: async card => {
			let school = card.abilities.at(-1);
			card.holder.effects["witchers"][school]--;
		}
	},
	witcher_bear_school: {
		name: "Bear School of Witchers",
		description: "Each unit of this witcher school is boosted by 2 for each card of this given school.",
		placed: async card => {
			let school = card.abilities.at(-1);
			if (!card.holder.effects["witchers"][school]) card.holder.effects["witchers"][school] = 0;
			card.holder.effects["witchers"][school]++;
		},
		removed: async card => {
			let school = card.abilities.at(-1);
			card.holder.effects["witchers"][school]--;
		}
	},
	witcher_cat_school: {
		name: "Cat School of Witchers",
		description: "Each unit of this witcher school is boosted by 2 for each card of this given school.",
		placed: async card => {
			let school = card.abilities.at(-1);
			if (!card.holder.effects["witchers"][school]) card.holder.effects["witchers"][school] = 0;
			card.holder.effects["witchers"][school]++;
		},
		removed: async card => {
			let school = card.abilities.at(-1);
			card.holder.effects["witchers"][school]--;
		}
	},
	witcher_griffin_school: {
		name: "Griffin School of Witchers",
		description: "Each unit of this witcher school is boosted by 2 for each card of this given school.",
		placed: async card => {
			let school = card.abilities.at(-1);
			if (!card.holder.effects["witchers"][school]) card.holder.effects["witchers"][school] = 0;
			card.holder.effects["witchers"][school]++;
		},
		removed: async card => {
			let school = card.abilities.at(-1);
			card.holder.effects["witchers"][school]--;
		}
	},
	shield: {
		name: "Shield",
		description: "Protects units in the row from all abilities except weather effects.",
		weight: (card) => 30
	},
	seize: {
		name: "Seize",
		description: "Move the Melee unit(s) with the lowest strength on your side of the board/ Their abilities won't work anymore.",
		activated: async card => {
			let opCloseRow = board.getRow(card, "close", card.holder.opponent());
			let meCloseRow = board.getRow(card, "close", card.holder);
			if (opCloseRow.isShielded()) return;
			let units = opCloseRow.minUnits();
			if (units.length === 0) return;
			await Promise.all(units.map(async c => await c.animate("seize")));
			units.forEach(async c => {
				c.holder = card.holder;
				await board.moveToNoEffects(c, meCloseRow, opCloseRow);
			});
			await board.toGrave(card, card.holder.hand);
		},
		weight: (card) => {
			if (card.holder.opponent().getAllRows()[0].isShielded()) return 0;
			return card.holder.opponent().getAllRows()[0].minUnits().reduce((a, c) => a + c.power, 0) * 2
		}
	},
	lock: {
		name: "Lock",
		description: "Lock/cancels the ability of the next unit played in that row (ignores units without abilities and heroes).",
		weight: (card) => 20
	},
	knockback: {
		name: "Knockback",
		description: "Pushes all units of the selected row (Melee or Ranged) or row back towards the Siege row, ignores shields.",
		activated: async (card, row) => {
			let units = row.findCards(c => c.isUnit());
			if (units.length > 0) {
				let targetRow;
				for (var i = 0; i < board.row.length; i++) {
					if (board.row[i] === row) {
						if (i < 3) targetRow = board.row[Math.max(0, i - 1)];
						else targetRow = board.row[Math.min(5, i + 1)];
					}
				}
				await Promise.all(units.map(async c => await c.animate("knockback")));
				units.map(async c => {
					if (c.abilities.includes("bond") || c.abilities.includes("morale") || c.abilities.includes("horn")) await board.moveTo(c, targetRow, row);
					else await board.moveToNoEffects(c, targetRow, row);
				});
			}
			await board.toGrave(card, card.holder.hand);
		},
		weight: (card) => {
			if (board.getRow(card, "close", card.holder.opponent()).cards.length + board.getRow(card, "ranged", card.holder.opponent()).cards.length === 0) return 0;
			let score = 0;
			if (board.getRow(card, "close", card.holder.opponent()).cards.length > 0 && (
					board.getRow(card, "close", card.holder.opponent()).effects.horn > 0 ||
					board.getRow(card, "ranged", card.holder.opponent()).effects.weather ||
					Object.keys(board.getRow(card, "close", card.holder.opponent()).effects.bond).length > 1 ||
					board.getRow(card, "close", card.holder.opponent()).isShielded()
				)
			) score = Math.floor(board.getRow(card, "close", card.holder.opponent()).cards.filter(c => c.isUnit()).reduce((a, c) => a + c.power, 0) * 0.5);
			if (board.getRow(card, "ranged", card.holder.opponent()).cards.length > 0 && (
					board.getRow(card, "ranged", card.holder.opponent()).effects.horn > 0 ||
					board.getRow(card, "siege", card.holder.opponent()).effects.weather ||
					Object.keys(board.getRow(card, "ranged", card.holder.opponent()).effects.bond).length > 1 ||
					board.getRow(card, "ranged", card.holder.opponent()).isShielded()
				)
			) score = Math.floor(board.getRow(card, "close", card.holder.opponent()).cards.filter(c => c.isUnit()).reduce((a, c) => a + c.power, 0) * 0.5);
			return Math.max(1, score);
		}
	},	
	alzur_maker: {
		description: "Destroy one of your units on the board and summon a Koshchey.",
		activated: (card, player) => {
			player.endTurnAfterAbilityUse = false;
			ui.showPreviewVisuals(card);
			ui.enablePlayer(true);
			if(!(player.controller instanceof ControllerAI)) ui.setSelectable(card, true);
		},
		target: "wu_koshchey",
		weight: (card, ai, max) => {
			if (ai.player.getAllRowCards().filter(c => c.isUnit()).length === 0) return 0;
			return ai.weightScorchRow(card, max, "close");
		}
	},

	vilgefortz_sorcerer: {
		description: "Clear all weather effects in play.",
		activated: async () => {
			tocar("clear", false);
			await weather.clearWeather()
		},
		weight: (card, ai) => ai.weightCard(card_dict["spe_clear"])
	},
	anna_henrietta_duchess: {
		description: "Destroy one Commander's Horn in any opponent's row of your choice.", //@ability1 this can be used for commandrs horn second option, once we have chose to play it or remove opponents
		activated: (card, player) => {
			player.endTurnAfterAbilityUse = false;
			ui.showPreviewVisuals(card);
			ui.enablePlayer(true);
			if (!(player.controller instanceof ControllerAI)) ui.setSelectable(card, true);
		},
		weight: (card, ai) => {
			let horns = card.holder.opponent().getAllRows().filter(r => r.special.findCards(c => c.abilities.includes("horn")).length > 0).sort((a, b) => b.total - a.total);
			if (horns.length === 0) return 0;
			return horns[0].total;
		}
	},
	toussaint_wine: {
		name: "Toussaint Wine",
		description: "Placed on Melee or Ranged row, boosts all units of the selected row by two. Limited to one per row.",
		placed: async card => await card.animate("morale")
	},
	anna_henrietta_ladyship: {
		description: "Restore a unit from your discard pile and play it immediatly.",
		activated: async card => {
			let newCard;
			if (card.holder.controller instanceof ControllerAI) newCard = card.holder.controller.medic(card, card.holder.grave);
			else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
				await ui.queueCarousel(card.holder.grave, 1, (c, i) => newCard = c.cards[i], c => c.isUnit(), false, false);
			}
			if (newCard) await newCard.autoplay(card.holder.grave);
		},
		weight: (card, ai, max, data) => ai.weightMedic(data, 0, card.holder)
	},

	anna_henrietta_grace: {
		description: "Cancel Decoy ability for one round.",
		activated: async card => {
			game.decoyCancelled = true;
			await ui.notification("toussaint-decoy-cancelled", 1200);
			game.roundStart.push(async () => {
				game.decoyCancelled = false;
				return true;
			});
		},
		weight: (card) => game.decoyCancelled ? 0 : 10
	},
	meve_princess: {
		description: "If the opponent has a total of 10 or higher on one row, destroy that row's strongest card(s) (affects only the opponent's side of the battle field).",
		activated: async (card, player) => {
			player.endTurnAfterAbilityUse = false;
			ui.showPreviewVisuals(card);
			ui.enablePlayer(true);
			if (!(player.controller instanceof ControllerAI)) ui.setSelectable(card, true);
		},
		weight: (card, ai, max) => {
			return Math.max(ai.weightScorchRow(card, max, "close"), ai.weightScorchRow(card, max, "ranged"), ai.weightScorchRow(card, max, "siege"));
		}
	},
	shield_c: {
		name: "Melee Shield",
		description: "Protects units in the Melee row from all abilities except weather effects.",
		weight: (card) => 20
	},
	shield_r: {
		name: "Ranged Shield",
		description: "Protects units in the Ranged row from all abilities except weather effects.",
		weight: (card) => 20
	},
	shield_s: {
		name: "Siege Shield",
		description: "Protects units in the Siege row from all abilities except weather effects.",
		weight: (card) => 20
	},
	meve_white_queen: {
		description: "All medic cards can choose two unit cards from the discard pile (affects both players).",
		gameStart: () => game.medicCount = 2
	},
	carlo_varese: {
		description: "If the opponent has a total of 10 or higher on one row, destroy that row's strongest card(s) (affects only the opponent's side of the battle field).",
		activated: async (card, player) => {
			player.endTurnAfterAbilityUse = false;
			ui.showPreviewVisuals(card);
			ui.enablePlayer(true);
			if (!(player.controller instanceof ControllerAI)) ui.setSelectable(card, true);
		},
		weight: (card, ai, max) => {
			return Math.max(ai.weightScorchRow(card, max, "close"), ai.weightScorchRow(card, max, "ranged"), ai.weightScorchRow(card, max, "siege"));
		}
	},
	francis_bedlam: {
		description: "Send all spy unit cards to the grave of the side they are on.",
		activated: async (card, player) => {
			let op_spies = card.holder.opponent().getAllRowCards().filter(c => c.isUnit() && c.abilities.includes("spy"));
			let me_spies = card.holder.getAllRowCards().filter(c => c.isUnit() && c.abilities.includes("spy"));
			await op_spies.map(async c => await board.toGrave(c, c.currentLocation));
			await me_spies.map(async c => await board.toGrave(c, c.currentLocation));
		},
		weight: (card, ai, max) => {
			let op_spies = card.holder.opponent().getAllRowCards().filter(c => c.isUnit() && c.abilities.includes("spy")).reduce((a,c) => a + c.power,0);
			let me_spies = card.holder.getAllRowCards().filter(c => c.isUnit() && c.abilities.includes("spy")).reduce((a, c) => a + c.power,0);
			return Math.max(0, op_spies - me_spies);
		}
	},
	cyprian_wiley: {
		description: "Seize the unit(s) with the lowest strength of the opponents melee row.",//ability1 this can be used for sucubus to steal unit but one more condition, 6 curent power or less, and no commanders horn units
		activated: async card => {
			let opCloseRow = board.getRow(card, "close", card.holder.opponent());
			let meCloseRow = board.getRow(card, "close", card.holder);
			if (opCloseRow.isShielded()) return;
			let units = opCloseRow.minUnits();
			if (units.length === 0) return;
			await Promise.all(units.map(async c => await c.animate("seize")));
			units.forEach(async c => {
				c.holder = card.holder;
				await board.moveToNoEffects(c, meCloseRow, opCloseRow);
			});
		},
		weight: (card) => {
			if (card.holder.opponent().getAllRows()[0].isShielded()) return 0;
			return card.holder.opponent().getAllRows()[0].minUnits().reduce((a, c) => a + c.power, 0) * 2
		}
	},
	
	succubus: {
		name: "succubus",
		description: "Seize a random unit with the lowest strength of the opponent's melee row.",
		placed: async card => {
			let opCloseRow = board.getRow(card, "close", card.holder.opponent());
			let meCloseRow = board.getRow(card, "close", card.holder);
			if (opCloseRow.isShielded()) return;
	
			let units = opCloseRow.minUnits();
			if (units.length === 0) return;
	
			// Select a random unit from the array of weakest units
			let randomIndex = Math.floor(Math.random() * units.length);
			let randomUnit = units[randomIndex];
	
			await randomUnit.animate("seize");
			randomUnit.holder = card.holder;
			await board.moveToNoEffects(randomUnit, meCloseRow, opCloseRow);
		},
		weight: (card) => {
			let opMeleeRow = card.holder.opponent().getRow("close");
			if (opMeleeRow.isShielded()) return 0;
	
			let minUnitPowerSum = opMeleeRow.minUnits().reduce((a, c) => a + c.power, 0);
			return minUnitPowerSum * 2;
		}
	},
	
	gudrun_bjornsdottir: {
		description: "Summon Flyndr's Crew",
		activated: async (card, player) => {
			let new_card = new Card("sy_flyndr_crew", card_dict["sy_flyndr_crew"], player);
			await board.addCardToRow(new_card, new_card.row, card.holder);
		},
		weight: (card, ai, max) => {
			return card.holder.getAllRows()[0].cards.length + Number(card_dict["sy_flyndr_crew"]["strength"]);
		}
	},
	cyrus_hemmelfart: {
		description: "Play a Dimeritum Shackles card in any of the opponent's row.",
		activated: async (card, player) => {
			player.endTurnAfterAbilityUse = false;
			ui.showPreviewVisuals(card);
			ui.enablePlayer(true);
			if (!(player.controller instanceof ControllerAI)) ui.setSelectable(card, true);
		},
		weight: (card) => 20
	},
	//delete down if it does not work! 
	PlayShacklesFromDeck: {
		name:"cyrus_hemmelfart",
		description: "Play a Dimeritum Shackles card in any of the opponent's row.", //help marko!
		placed: async (card, player) => {
			player.endTurnAfterAbilityUse = false;
			ui.showPreviewVisuals(card);
			ui.enablePlayer(true);
			if (!(player.controller instanceof ControllerAI)) ui.setSelectable(card, true);
		},
		weight: (card) => 20
	},
	//delete up if it does not work!
	azar_javed: {
		description: "Destroy the enemy's weakest hero card (max 1 card).",
		activated: async (card, player) => {
			let heroes = player.opponent().getAllRowCards().filter(c => c.hero);
			if (heroes.length === 0) return;
			let target = heroes.sort((a, b) => a.power - b.power)[0];
			await target.animate("scorch", true, false);
			await board.toGrave(target, target.currentLocation);
		},
		weight: (card, ai, max) => {
			let heroes = card.holder.opponent().getAllRowCards().filter(c => c.hero);
			if (heroes.length === 0) return 0;
			return heroes.sort((a, b) => a.power - b.power)[0].power;
		}
	},
	bank: {
		name: "Bank",
		description: "Draw a card from your deck.",
		activated: async card => {
			card.holder.deck.draw(card.holder.hand);
			await board.toGrave(card, card.holder.hand);
		},
		weight: (card) => 20
	},
	witch_hunt: {
		name: "Witch Hunt",
		description: "Destroy the weakest unit(s) on the opposite row",
		placed: async card => {
			let row = card.currentLocation.getOppositeRow();
			if (row.isShielded() || game.scorchCancelled) return;
			let units = row.minUnits();
			await Promise.all(units.map(async c => await c.animate("scorch", true, false)));
			await Promise.all(units.map(async c => await board.toGrave(c, row)));
		}
	},
	zerrikanterment: {
		description: "Amount of worshippers boost is doubled.",
		gameStart: () => game.whorshipBoost *= 2
	},
	baal_zebuth: { //ability we need this for printed card we have but also one more option for you or opponents graveyard
		description: "Select 2 cards from your opponent's discard pile and shuffle them back into his/her deck.",
		activated: async (card) => {
			let grave = card.holder.opponent().grave;
			if (card.holder.controller instanceof ControllerAI) {
				let cards = grave.findCardsRandom(false,2);
				await Promise.all(cards.map(async c => await board.toDeck(c, c.holder.grave)));
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
			await ui.queueCarousel(grave, 2, (c, i) => board.toDeck(c.cards[i], c), () => true);
		},
		weight: (card) => {
			if (card.holder.opponent().grave.cards.length < 5) return 0;
			else return 20;
		}
	},
	backto_deck: { //ability we need this for printed card we have but also one more option for you or opponents graveyard
		backto_deck:"backto_deck",
		description: "Select 2 cards from your opponent's discard pile and shuffle them back into his/her deck.",
		placed: async (card) => {
			let grave = card.holder.opponent().grave;
			if (card.holder.controller instanceof ControllerAI) {
				let cards = grave.findCardsRandom(false,2);
				await Promise.all(cards.map(async c => await board.toDeck(c, c.holder.grave)));
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
			await ui.queueCarousel(grave, 2, (c, i) => board.toDeck(c.cards[i], c), () => true);
		},
		weight: (card) => {
			if (card.holder.opponent().grave.cards.length < 5) return 0;
			else return 20;
		}
	},
	rarog: {
		description: "Draw a random card from the discard pile to your hand (any card) and then shuffle the rest back into the deck.",
		activated: async (card) => {
			if (card.holder.grave.cards.length === 0) return;
			let grave = card.holder.grave;
			let c = grave.findCardsRandom(false, 1)[0];
			await board.toHand(c, c.holder.grave);
			Promise.all(card.holder.grave.cards.map(c => board.toDeck(c, card.holder.grave)));
		},
		weight: (card) => {
			let medics = card.holder.hand.cards.filter(c => c.abilities.includes("medic"));
			if (medics.length > 0 || card.holder.grave.cards.length == 0) return 0;
			else return 15;
		}
	},
	whorshipper: {
		name: "Whorshipper",
		description: "Boost by 1 all whorshipped units on your side of the board.",
		placed: async card => {
			if (card.isLocked()) return;
			card.holder.effects["whorshippers"]++;
		},
		removed: async card => {
			if (card.isLocked()) return;
			card.holder.effects["whorshippers"]--;
		},
		weight: (card) => {
			let wcards = card.holder.getAllRowCards().filter(c => c.abilities.includes("whorshipped"));
			return wcards.length * game.whorshipBoost;
		}
	},
	whorshipped: {
		name: "Whorshipped",
		description: "Boosted by 1 by all whorshippers present on your side of the board.",
	},
	inspire: {
		name: "Inspire",
		description: "All units with Inspire ability take the highest base strength of the Inspire units on your side of the board. Still affected by weather.",
	},	
	haraldthecriple: { //Draw 4 random to hand, then discard 4 of your choice from hand to your graveyard 
		description: "Draw 4 random cards from your deck to your hand, then move 4 cards of your choice from hand to your graveyard.",
		activated: async (card) => {
			if (card.isLocked()) return;
			let hand = card.holder.hand;
			let deck = card.holder.deck;
			
			// Draw 2 random cards from deck to hand
			for (let i = 0; i < 4; i++) {
				if (deck.cards.length > 0) await deck.draw(hand);
			}
	
			// Prompt player to choose 2 cards from hand to move to graveyard
			if (card.holder.controller instanceof ControllerAI) {
				let cardsToDiscard = card.holder.controller.discardOrder(card).splice(0, 4);
				await Promise.all(cardsToDiscard.map(async c => await board.toGrave(c, hand)));
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
			await ui.queueCarousel(hand, 4, (c,i) => board.toGrave(c.cards[i], c), () => true);
		}
	},

	any2decktograveyard: {  //LEADER NILFGARD Emhyr var Emreis - Invader of the North",
		description: "Chose Any 3 cards from your deck, and move them to your graveyard",
		activated: async (card) => {
			let deck = board.getRow(card, "deck", card.holder);
			
	
			if (card.holder.controller instanceof ControllerAI) {
				let cards = card.holder.controller.discardOrder(card).splice(0, 2).filter(c => c.basePower < 7);
				await Promise.all(cards.map(async c => await board.toGrave(c, card.holder.hand)));
				card.holder.deck.draw(card.holder.hand);
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
	
			await ui.queueCarousel(deck, 3, (c, i) => board.toGrave(c.cards[i], deck), () => true, true);
			
		},
		weight: (card, ai) => {
			let cards = ai.discardOrder(card).splice(0, 2).filter(c => c.basePower < 7);
			if (cards.length < 2) return 0;
			return cards[0].abilities.includes("muster") ? 50 : 25;
		}
	},

	onecardfromdecktograve: {  //mortiersen unit ability same as nilfgard leader
		name: "onecardfromdecktograve",
		description: "Chose 1 card from your deck, and move it to your graveyard",
		placed: async (card) => {
			let deck = board.getRow(card, "deck", card.holder);
			
	
			if (card.holder.controller instanceof ControllerAI) {
				let cards = card.holder.controller.discardOrder(card).splice(0, 2).filter(c => c.basePower < 7);
				await Promise.all(cards.map(async c => await board.toGrave(c, card.holder.hand)));
				card.holder.deck.draw(card.holder.hand);
				return;
			} else {
				try {
					Carousel.curr.exit();
				} catch (err) {}
			}
	
			await ui.queueCarousel(deck, 1, (c, i) => board.toGrave(c.cards[i], deck), () => true, true);
			
		},
		weight: (card, ai) => {
			let cards = ai.discardOrder(card).splice(0, 2).filter(c => c.basePower < 7);
			if (cards.length < 2) return 0;
			return cards[0].abilities.includes("muster") ? 50 : 25;
		}
	},

	//0 - add any kind of sorting when building/creating/adding cards before the game starts, it can be special, then gold, then ability units, then units with no ability OR
	// special and then on top sorted by card numbers/strenght/power, it is a mess in this state.
	
	// 1 - create agile2 and agile3, curent agile (LINE 89) is sword OR bow, agile2 should be sword OR catapult, agile3 should be bow OR catapult.
	
	// 2 - create full mobile ability, those cards can go anywhere on your side of the board, sword OR bow OR catapult
	
	// 3 - All leader cards should have numbers/value and should be mobile, they should no longer be just ability but they go out on the board same as regular or gold units
	
	// 4 - add mouse scroll up and down to card selecter/card picker/carusel
	
	// 5 - add option not just to turn ON and OFF music but also to increase and decrease volume
	
	// 6 - select X amount of cards from your deck(you choose, not random) and put them in your graveyard. (change nilfgardian leader that cancels opponents leader) eredin (lines 326 to 349) has similar
	// but it goes from hand to graveyard then from deck to hand
	
	// 7 - add condition to line/single row scorch (lines from 74 to 89) 
	// if I place it in swords/close, destroys only on the opponents opisite side, close/sword only. Same logic if I place my line/row scorch on bow and catapult line/row.
	
	// 8 - add reveal ability of opponents X amount of random cards (lines from 260 to 275 have this)
	
	// 9 - add reveal ability of your cards, X amount (in your hand) of random cards (lines from 260 to 275 have this)
	
	// 10 - add new option and single card selection/targeting on the entire board by the player (decoy can now target and select single card, so same ability of targeting but on entire board)
	
	// 11 - add Target opponents unit of players choice with X value or less, and destoy it. (destroyed unit goes to opponents graveyard) use this new ability instead of lines from 301 to  303
	
	// 12 - in javascript/factions lines from 94 to 105 should be added to scoiatel deck faction ability also (draw a random card from deck to hand when you lose a round)
	
	// 13 - add 4 special card scorch so the maximum amount goes from 3 to 4 but only for scoiatel deck
	
	// 14 - commanders horn can not be played if the player does not have 2 cards in his hand to reveal (commanders horn does not reveal it self)
	
	// 15 - add 2 abilities to a card a choice so the player can choose 1 or the other ability ( standard carosel /card selector is open when choosing betwen two abilities)
	
	// 16 - every commanders horn special card should have two coises play it on your board(as it is now) OR destroy any commaders horn card (of players choice if there are multiple) on the opponents side of the board
	// can destroy both units or special (this already exists in 727 to 740)
	
	// 17 - clear weather/clear skies (lines from 4 to 6) should have two options for a player to choose from. First one is as it is now, remove all active weather cards from the board(frost AND fog aAND rain)
	// other options is to play a random unit card from his deck ( no hero/gold or special cards)
	
	// 18 - add ability to chose and play a specific card from your deck OR a diferent specific card from your deck.
	
	// 19 - add ability of a card to return to your hand if you lose the round (if you win or it is a draw it goes as usual to players graveyard, MONSTER deck ability takes priority, it should override this cards ability)
	// ciri return from our printed card game
	
	// 20 - a new spy card (goes to opponents board) then the player draws X amount of random cards from his deck, gets to see them, chose 1 that goes to his hand, other are returned back to deck.
	// misterius Elf from our printed card game 
	
	// 21 - add sacrifice ability, Target your unit, move it to graveyard, this card will take its place. ( can not be played if there are no units, can not target goold/hero cards) 
	// Sabrina sacrifice from our printed card game 
	
	// 22 - dandelion card should be full mobile and it can not be played if the player is not able to reveal 2 random cards in his hand
	
	// 23 - Add new ability, play any special ( non weather ) card of your choice from your deck.  Here maybe we need to create two categories of special cards (weather : frost fog rain clear skies, AND all others)
	// Golem special from our printed card game  
	
	// 24 - a new spy card (goes to opponents board) then the player draws X amount of random cards from his deck, some face down(not revealed to the player, deck background should be visibile) 
	// some face up revealed to the player,chose 1 that goes to his hand, other are returned back to deck.
	// Avalach cursed from our printed card game 
	
	// 25 - add ability to unreveal(hide again) X amount of cards in YOUR hand.
	// ambasador (nilfgard) from our printed card game 
	
	// 26 - a new condition for ability to be trigered or not, Only If opponent did not pass, chose and destroy 1 of his unit, but then opponent draws 1 random card from his deck to his hand OR 
	// destroy 1 of your unit, then play 1 random card from deck to board.
	// Vilgefortz (nilfgard) from our printed card game 
	
	// 27 - update for some nilfgardian spyes (new spy basicaly)  Goes on opponents board. Draw 2 random cards from your deck, take 1 into your hand, other will go to your graveyard.
	
	// 28 - Target unit on YOUR side of the board, then play unit from your deck with the same base value as your target card.
	// Zoltan target from our printed card game 
	
	// 29 - Cancel the effect of only 1 active weather card of your choice. 
	// Triss weather from our printed card game 
	
	// 30 - Play any special card from your hand, then draw random card from your deck to your hand. (if the player has no special cards in his hand, nothing happends)
	// Regis special from our printed card game 
	
	// 31 - a new spy card (goes to opponents board) Draw X random cards from opponents deck, chose and play 1 instantly, (other two will go to opponents graveyard)
	// Operater from our printed card game 
	
	// 32 - Move 1 opponents unit of your choice, to a different row of your choice.(ability of the moved card is not retrigered)
	// Geralt aard from our printed card game 
	
	// 33 - If this card is on the board when the round ends, it will go to your oppoents hand if you won the round. Draw/Lost it goes to your graveyard.
	//Saskia Dragon from our printed card game
	
	// 34 - Draw 3 random cards from your deck, 2 face up, 1 face down, select and play one, return other 2 to your deck.
	// Priscilla from our printed card game
	
	// 35 - Move 2 of your units(player gets to chose wich 2) to this cards row. (does not affect gold/hero cards)
	// Golem from our printed card game
	
	// 36 - Draw 2 random cards from your deck to your hand, them move 2 cards of your choice, from your hand to your graveyard.
	// Yennefer swap from our printed card game
	
	// 37 - Select 1 unit from ANY graveyard, and move it to the other/opposite graveyard.(nothing happends if both graveyards are empty)
	// bloddy baron from our printed card game
	
	// 38 - Destroy the weakest unit(s) on entire board. afects both players basicaly scorch just for the all weakest /lowest instead of strongest/highest
	// Borkh dragon from our printed card game
	
	// 39 - Target a unit on your side of the board, Remove unit from your board(unit goes to your graveyard) 
	//Then draw 3 random cards from your deck, chose and play 1, return other 2 to your deck. (similar to priscilla but all cards are revealed and kiling of your own unit is nessesary) 
	// if there are no your own units to kill/destroy, nothing happends
	// Ciri target from our printed card game 
	
	// 40 - Destroy one opponents weakest unit of your choice on the oposite row
	// Sinthia the Mage(nilfgard) from our printed card game 
	
	// 41 - add ability to play FROST card from your deck (if you do not have it in your deck, nothing happends)

	// 42 - add ability to play FOG card from your deck (if you do not have it in your deck, nothing happends)

	// 43 - add ability to play RAIN card from your deck (if you do not have it in your deck, nothing happends)

	// 44 - Move any 2 units from any graveyard to the other, OR  Move two units from any graveyard back to current owners deck
	//Nilfgard Mage Knight from our printed card game 

	// 45 - Play unit from your hand, then draw 1 random card from your deck to your hand.
	// cantarela nilfgard  from our printed card game

	// 46 - Target any unit on the entire board and turn it permanently into Jade Figurine. Jade Figurine should be a new card(gold) that will take the place of the targeted card
	// targeted card is banished from the game(does not go to graveyard) jade figurine permanatly until the end of the game takes its place.
	//Nilfgard Knight Mage from our printed card game 

	// 47 - Select 1 card in your hand, the selected card goes to your graveyard, then draw a random card from your deck of the same type as your selected card.(Gold/hero, Special or Unit) to your hand
	// Jan Calviet (nilfgard) from our printed card game 

	// 48 - If the opponent did not pass, both players draw 1 random card from their deck to hand. The opponent's card is revealed.
	// Albrich (nilfgard) from our printed card game 

	// 49 - Draw X amount of random units from the opponent's graveyard, instatly play 1 card of your choise, return the others to the opponents graveyard
	// Caretaker from our printed card game 

	// 50 - when using medic on a agile or mobile unit player should chose where resurected unit should be placed (now it is random)

	// 51 - North realms spy (goes to opponents board) Draw 1 random card from your deck, draw 1 random card from the opponent's deck, take one into your hand, and return the other to its owner's deck
	// Prince stanis from our printed card game 

	// 52 - Reveal 1 card in your hand. Then play Frost or Fog or Rain or Clear Skies (weather clear effect only)
	//If you dont have other card in hand, or if you do not have 1 card in hand that is not revealed, nothing happends/ability is not triggered.
	// Aeromancy from our printed card game 

	// 53 - When your unit goes from board to graveyard (not on round end, so any kind of removal by you or opponent) 
	//this card will go from your hand to the board automatically, then you draw 1 random card from your Deck to your hand. ( if you already passed nothing happends)
	// Radovid NR from our printed card game 

	// 54 - If your opponent did not pass. Reenable your Leader or draw a random card from the deck to hand ( Your opponent will have the same choices) if opponent has passed, nothing happends.
	//North Realm Elite Assassin from our printed card game

	// 55 - Target 1 opponents unit with 6 or less CURRENT value or less, then steal/moe it to your side of the board 
	//(no commanders horn units, if unit has any ability it is not retrigered)
	// Succubus from our printed card game 

	// 56 - Take one unit on your side of the board back to your hand.(basicaly hero/gold decoy with points)
	//Caranthir from our printed card game 

	// 57 - Return both player's highest unit on the board back to their decks (if there is a draw between units, it is a random decision)
	//Rat Plauge Maiden from our printed card game 

	// 58 - Opponent steals your unit, you steal the opponent's unit  
	//(Can not be the same unit or commanders horn units, no ability of stolen units will be reactivated) Works on any player's empty board, if only 1 card is pressent it gets stolen, other playe gets nothing.

	// 59 - sigradifa skeligas new leader , Play any special (non weather) card from your deck.
	
	// 60 - King bran remake - If your opponent did not pass. Draw 1 random card from both decks. Take one into your hand, other will go to opponents hand.

	// 61 - skeligas leade morkvarg - If your opponent did not pass. Draw 2 random cards from your deck to hand, opponent draws 1.

	// 62 - skeligas leader harald the criple - Draw 4 random cards from deck to hand, then move 4 cards from hand to your graveyard.

	// 63 - Play 1 random unit from your deck then, play 1 more random unit from your deck
	//Great Sword Warrior from our printed card game 
	
	// 64 - Take 1 unit on your side of the board back to hand, then play 1 card from your hand. (like decoy but instant and you can play diferent card, it does not have to be the one you picked up)
	//DJenge from our printed card game 

	//65 - Move up to max of 2 of your units to a different rows. (select one unit then move to a diferent row, then repeat)
	//Franchesca The organiser scoiatel leader upgrade

	//66 - Reveal 1 random card in your hand. Then select any gold card from your deck, with 2 or more value and play it to the board
	//Elven Dragon from our printed card game 

	// 67 - Replace a card in your hand (goes to your graveyard) with Scorch from your deck.
	//Skojatel Pyro technician from our printed card game 

	// 68 - Resurrect any unit from your graveyard OR reveal 1 random card in your hand, and resurrect any unit in opponents graveyard.
	//Ida Emean from our printed card game 
};