// box.sidebar from https://github.com/Snarling/bitburner-scripts/tree/main/box
import { createSidebarItem, sidebar } from "/box/box.js"
// numFormat from https://github.com/tyrope/bitburner/blob/master/lib/format.js
import { numFormat } from "/format.js"

/** @param {NS} ns **/
export async function main(ns) {
	let style=`<style></style>`;
	let item=createSidebarItem("CorpManager",`
		${style}
		<div class=g2></div>
		<div class=g2>
			<span>
				<center>Corp Name: <div id="CM_corpName"></div></center></br>
				<table><tr>
				<td>Funds: <div id="CM_corpFunds"></div></td>
				<td>Revenue: <div id="CM_corpRevenue"></div></td>
				<td>Expenses: <div id="CM_corpExpenses"></div></td>
				</tr></table>
			</span>
			</br>
			<span>
				Divisions:</br></br>
				<div id="CM_divisions"></div>
			</span>
		</div>`,"&#xeb7c");
	//&#xe0af
	let cm_running=true;

	let moneyFormat=(money)=> {
		return "$" + numFormat(money);
	}

	async function updateCorp() {
		if (!sidebar.contains(item)) {cm_running=false; return;};
		
		let corporation=ns.corporation.getCorporation();
		document.getElementById('CM_corpName').innerHTML=corporation.name;
		document.getElementById('CM_corpFunds').innerHTML=moneyFormat(corporation.funds);
		document.getElementById('CM_corpRevenue').innerHTML=moneyFormat(corporation.revenue);
		document.getElementById('CM_corpExpenses').innerHTML=moneyFormat(corporation.expenses);
		
		let divisions=corporation.divisions;
		let divisionsElem=document.getElementById('CM_divisions');
		// Construct HTML
		divisionsElem.innerHTML=`${divisions.map(division=>`
			- ${division.name}</br>
			Type: ${division.type}</br>
			</br>
			Research: ${numFormat(division.research)}</br>
			</br>
			Products:</br>
			${division.products.map(product=>`
				${ns.corporation.getProduct(division.name, product).name} ${ns.corporation.getProduct(division.name, product).developmentProgress < 100 ? `(${ns.nFormat(ns.corporation.getProduct(division.name, product).developmentProgress, '0.00')}%)` : ""}
				`).join('</br>')}
			</br>
			<button id="cm_${division.name}_cycleProduct">Cycle Products</button></br>
			</br>
			Offices:</br>
			${division.cities.map(office=>`
				- ${office}</br>
				Employees: ${ns.corporation.getOffice(division.name, office).employees.length}/${ns.corporation.getOffice(division.name, office).size} (${getNumUnemployed(division.name, office)})</br>
				<button id="cm_${division.name}_${office}_add15">Add 15 (${moneyFormat(ns.corporation.getOfficeSizeUpgradeCost(division.name, office, 15))})</button></br>
				<button id="cm_${division.name}_${office}_add150">Add 150 (${moneyFormat(ns.corporation.getOfficeSizeUpgradeCost(division.name, office, 150))})</button></br>
				${getNumUnemployed(division.name, office) > 0 ? `<button id="cm_${division.name}_${office}_assign">Assign Employees</button></br>` : ""}
				`).join('</br>')}
			`)
		}`;

		// Attach button methods
		divisions.map(division=>{
			let id_cycleProduct = `cm_${division.name}_cycleProduct`;
			let button_cycleProduct = document.getElementById(id_cycleProduct);
			button_cycleProduct.addEventListener("click", async function() {
				let currentProducts = division.products;
				let lowestID = 99999;
				let highestID = 0;
				
				// Get highest product ID number from name
				for(let i=0; i < division.products.length; i++) {
					let currentID = Number(division.products[i].split(" ")[1]);
					if(currentID > highestID) {
						highestID = currentID;
					}
					if(currentID < lowestID) {
						lowestID = currentID;
					}
				}
				if(highestID == 0) { return; }
				// Bump up ID by 1
				highestID++;
				// Remove oldest product
				ns.corporation.discontinueProduct(division.name, "Prod " + lowestID.toString());
				// Add new product
				let newProductName = "Prod " + highestID.toString();
				ns.corporation.makeProduct(division.name, "Aevum", newProductName, corporation.funds * 0.05, corporation.funds * 0.05);
				if(ns.corporation.hasResearched(division.name, "Market-TA.II")) {
					ns.corporation.sellProduct(division.name, "Aevum", newProductName, "MAX", "MP", true);
					ns.corporation.setProductMarketTA2(division.name, newProductName, true);
				}

				updateCorp();
			});

			division.cities.map(office=>{
				let id_add15 = `cm_${division.name}_${office}_add15`;
				let button_add15 = document.getElementById(id_add15);
				button_add15.addEventListener("click", async function() {
					let numAdd = 15;
					ns.corporation.upgradeOfficeSize(division.name, office, numAdd);
					for(let i=0;i<numAdd;i++) {
						ns.corporation.hireEmployee(division.name, office);
					}
					assignEmployees(division.name, office);
					updateCorp();
				});
				
				let id_add150 = `cm_${division.name}_${office}_add150`;
				let button_add150 = document.getElementById(id_add150);
				button_add150.addEventListener("click", async function() {
					let numAdd = 150;
					ns.corporation.upgradeOfficeSize(division.name, office, numAdd);
					for(let i=0;i<numAdd;i++) {
						ns.corporation.hireEmployee(division.name, office);
					}
					assignEmployees(division.name, office);
					updateCorp();
				});
				
				if(getNumUnemployed(division.name, office) > 0) {
					let id_assign = `cm_${division.name}_${office}_assign`;
					let button_assign = document.getElementById(id_assign);
					button_assign.addEventListener("click", async function() {
						assignEmployees(division.name, office);
						updateCorp();
					});
				}
			});
		});
	}

	function getNumUnemployed(divisionName, office) {
		let numUnemployed = 0;

		ns.corporation.getOffice(divisionName, office).employees.forEach(employee => {
			let job = ns.corporation.getEmployee(divisionName, office, employee).pos;
			
			if(job == "Unassigned") { numUnemployed++; }
		})

		return numUnemployed;
	}

	async function assignEmployees(divisionName, office) {
		let numPerJob = ns.corporation.getOffice(divisionName, office).size/5;
		await ns.corporation.setAutoJobAssignment(divisionName, office, "Operations", numPerJob);
		await ns.corporation.setAutoJobAssignment(divisionName, office, "Engineer", numPerJob);
		await ns.corporation.setAutoJobAssignment(divisionName, office, "Business", numPerJob);
		await ns.corporation.setAutoJobAssignment(divisionName, office, "Management", numPerJob);
		await ns.corporation.setAutoJobAssignment(divisionName, office, "Research & Development", numPerJob);
	}
	
	while(cm_running) {
		updateCorp();
		await ns.asleep(1000);
	}

}