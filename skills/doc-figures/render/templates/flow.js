TEMPLATES.flow = async (spec, DF) => {
  const stage = DF.stage();
  const inner = DF.el("div");
  stage.appendChild(inner);
  const {used} = await DF.layoutFlow(inner, {
    nodes: spec.nodes || [],
    edges: spec.edges || [],
    direction: spec.direction || "auto",
    numbered: spec.numbered !== false,
    nodeWidth: spec.nodeWidth,
    maxWidth: DF.canvasWidth(),
  });
  inner.style.margin = "0 auto";
  const items = [];
  if (used.later) items.push({line: "plain", text: "request"}, {line: "later", dashed: true, text: "reply that arrives later"});
  if (used.external) items.push({box: "external", text: "another company's system"});
  if (items.length && spec.legend !== false) DF.legend(items);
  if (spec.note) document.body.appendChild(DF.el("div", "note chk", spec.note));
};
