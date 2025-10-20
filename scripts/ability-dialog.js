import { rollScores, applyScores } from "./score-handler.js";
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
    this.rolledScores = []; // persist until Roll is pressed again
  }

  getData() {
    return {
      abilities: this.abilities,
      rolledScores: this.rolledScores
    };
  }

  activateListeners(html) {
    const tableWrapper = html.find("#ability-gen-table")[0];
    const modeSelector = html.find("#ability-gen-mode");
    const rollButton = html.find(".roll-btn");

    const updateRollVisibility = () => {
      rollButton.toggle(modeSelector.val() === "roll");
    };

    const onTableRendered = callback => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        callback();
      });
      observer.observe(tableWrapper, { childList: true });
    };

    const renderTableWithMode = mode => {
      const source = mode === "roll" ? this.rolledScores
                   : mode === "array" ? [15, 14, 13, 12, 10, 8]
                   : Array.from({ length: 8 }, (_, i) => i + 8);

      onTableRendered(() => {
        const formEl = html.find("form")[0];
        if (!formEl) return;
        formEl.querySelectorAll("select[name]").forEach(input => input.value = "");
        formEl.querySelectorAll(".mod-preview").forEach(mod => mod.textContent = "");
        wireScoreListeners(html, modeSelector, this.rolledScores);
      });

      renderAssignmentTable(tableWrapper, this.abilities, source, mode);
    };

    modeSelector.on("change", () => {
      updateRollVisibility();
      renderTableWithMode(modeSelector.val());
    });

    rollButton.on("click", async () => {
      this.rolledScores = await rollScores(this.actor);
      modeSelector.val("roll");
      updateRollVisibility();
      renderTableWithMode("roll");
    });

    html.find(".reset-btn").on("click", () => {
      html.find("select[name]").each((_, select) => {
        select.value = "";
        const preview = select.closest("tr")?.querySelector(".mod-preview");
        if (preview) preview.textContent = "";
      });
      renderTableWithMode(modeSelector.val());
    });

    html.find(".apply-btn").on("click", async event => {
      event.preventDefault();
      const success = await applyScores(this.actor, this.abilities, html, modeSelector.val(), this.rolledScores);
      if (success) this.close();
    });

    updateRollVisibility();
    renderTableWithMode("roll");
  }
}