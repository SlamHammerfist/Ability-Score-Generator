import { rollScores, applyScores, getModifier } from "./score-handler.js";
import { renderAssignmentTable, wireScoreListeners } from "./table-utils.js";

export class AbilityDialog extends Application {
  constructor(actor) {
    super({
      title: `Assign Ability Scores — ${actor.name}`,
      classes: ["ability-gen-dialog"],
      width: "auto",
      height: "auto",
      resizable: false,
      template: "modules/ability-gen/templates/ability-dialog.html"
    });

    this.actor = actor;
    this.abilities = Object.keys(actor.system.abilities);
    this.rolledScores = [];
    this._onActorUpdate = null;
  }

  static show(actor) {
    const existing = Array.from(Foundry.applications.instances.values())
      .find(app => app instanceof AbilityDialog && app.actor?.id === actor.id);

    if (!existing) new AbilityDialog(actor).render(true);
  }

  getData() {
    return {
      abilities: this.abilities,
      rolledScores: this.rolledScores
    };
  }

  activateListeners(html) {
    const tableWrapper = html[0].querySelector("#ability-gen-table");
    const modeSelector = html.find("#ability-gen-mode")[0];
    const rollButton = html[0].querySelector(".roll-btn");

    const updateRollVisibility = () => {
      if (rollButton) {
        rollButton.style.display = modeSelector.value === "roll" ? "inline-block" : "none";
      }
    };

    const renderTableWithMode = mode => {
      const source = mode === "roll" ? this.rolledScores
                   : mode === "array" ? [15, 14, 13, 12, 10, 8]
                   : Array.from({ length: 8 }, (_, i) => i + 8);

      renderAssignmentTable(tableWrapper, this.abilities, source, mode, this.actor);

      setTimeout(() => {
        wireScoreListeners(html, $(modeSelector), this.actor, this.abilities, this.rolledScores);
      }, 0);
    };

    modeSelector.addEventListener("change", () => {
      updateRollVisibility();
      renderTableWithMode(modeSelector.value);
    });

    rollButton?.addEventListener("click", async () => {
      this.rolledScores = await rollScores(this.actor);
      modeSelector.value = "roll";
      updateRollVisibility();
      renderTableWithMode("roll");
    });

    html.find(".reset-btn").on("click", () => {
      html.find("select[name]").each((_, select) => {
        select.value = "";
      });
      renderTableWithMode(modeSelector.value);
    });

    html.find(".apply-btn").on("click", async event => {
      event.preventDefault();
      const success = await applyScores(this.actor, this.abilities, html, modeSelector.value, this.rolledScores);
      if (success) this.close();
    });

    this._onActorUpdate = (actor, data) => {
      if (actor.id !== this.actor.id) return;
      this.updateCurrentScores();
    };

    Hooks.on("updateActor", this._onActorUpdate);

    updateRollVisibility();
    renderTableWithMode("roll");
  }

  updateCurrentScores() {
    const html = this.element[0];
    for (const ability of this.abilities) {
      const row = html.querySelector(`tr[data-ability="${ability}"]`);
      if (!row) continue;

      const current = foundry.utils.getProperty(this.actor.system, `abilities.${ability}.value`) ?? 0;
      const currentCell = row.querySelector(".current-score");
      if (currentCell) currentCell.textContent = current;

      const select = row.querySelector(`select[name="${ability}"]`);
      const assigned = parseInt(select?.value);
      const result = isNaN(assigned)
        ? current
        : current <= 10 ? assigned : current + (assigned % 10);
      const mod = isNaN(result) ? "—" : getModifier(result);

      const resultCell = row.querySelector(".result-score");
      const modCell = row.querySelector(".mod-preview");
      if (resultCell) resultCell.textContent = result;
      if (modCell) modCell.textContent = mod >= 0 ? `+${mod}` : `${mod}`;
    }
  }

  close(...args) {
    if (this._onActorUpdate) Hooks.off("updateActor", this._onActorUpdate);
    return super.close(...args);
  }
}