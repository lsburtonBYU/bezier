/**
 * A class representing a point in 2D space that can be drawn to a canvas
 *
 * @property {Number} x - the x coordinate of the point
 * @property {Number} y - the y coordinate of the point
 * @property {Number} radius - the radius of the point
 * @property {String} color - the color of the point
 * @property {String} label - an optional label for the point
 */
class Point {
  /**
   * The default color of a point
   *
   * @type {String}
   */
  static DEFAULT_COLOR = "#e0e0e0";

  /**
   * @constructor
   *
   * @param {Object} coord - the point coordinates
   * @param {Number} coord.x - the x coordinate of the point
   * @param {Number} coord.y - the y coordinate of the point
   * @param {Number} radius - the radius of the point
   * @param {String} [color = Point.DEFAULT_COLOR] - the color of the point
   * @param {String} [label=""] - **optional** label for the point
   */
  constructor(coord, radius, color = Point.DEFAULT_COLOR, label = "") {
    this.x = coord.x;
    this.y = coord.y;
    this.radius = radius;
    this.color = color;
    this.label = label;
  }

  /**
   * Determines if this point contains a point at the given coordinates. This method checks
   * using the point's bounding box.
   *
   * @param {Number} x - the x coordinate of the point to check
   * @param {Number} y - the y coordinate of the point to check
   * @returns {Boolean} - true if the point contains the given coordinates, false otherwise
   */
  contains(x, y) {
    return (
      x >= this.x - this.radius &&
      x <= this.x + this.radius &&
      y >= this.y - this.radius &&
      y <= this.y + this.radius
    );
  }

  /**
   * Draw the point using the canvas context
   *
   * @param {CanvasRenderingContext2D} ctx - the canvas context
   */
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    if (this.label) {
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "#333";
      ctx.fillText(this.label, this.x - 16, this.y - this.radius * 2.2);
    }
  }
}

/**
 * A class representing a draggable point in 2D space
 *
 * @extends Point
 * @property {Boolean} dragging - true if point is currently being dragged, false otherwise
 */
class DraggablePoint extends Point {
  /**
   * the color of a point when it is hovered over
   * @type {String}
   */
  static HOVER_COLOR = "#66a";

  /**
   * the color of a point when it is being dragged
   * @type {String}
   */
  static DRAG_COLOR = "blue";

  /**
   * @constructor
   *
   * @param {Object} coord - the point coordinates
   * @param {Object.x} coord.x - the x coordinate of the point
   * @param {Object.y} coord.y - the y coordinate of the point
   * @param {Number} radius - the radius of the point
   * @param {String=Point.DEFAULT_COLOR} color - the color of the point
   * @param {String=""} label - an optional label for the point
   */
  constructor(coord, radius, color = Point.DEFAULT_COLOR, label = "") {
    super(coord, radius, color, label);
    this.dragging = false;
  }

  /**
   * Move the point
   * @param {Number} x - the new x coordinate of the point
   * @param {Number} y - the new y coordinate of the point
   */
  move(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Display the hover state of the point
   */
  hover() {
    this.color = DraggablePoint.HOVER_COLOR;
  }

  /**
   * Display the drag state of the point
   */
  drag() {
    this.dragging = true;
    this.color = DraggablePoint.DRAG_COLOR;
  }

  /**
   * Display the default (normal) state of the point
   */
  default() {
    this.dragging = false;
    this.color = DraggablePoint.DEFAULT_COLOR;
  }
}

/**
 * A class representing a Bezier curve in 2D space
 *
 * @property {Array<DraggablePoint>} controlPoints - the curve control points
 * @property {Array<Point>} interpolationPoints - points used to linear interpolate the curve
 * @property {Number} t - the current t value of the interpolation
 * @property {Boolean} dragging - true if a control point is currently being dragged, false otherwise
 * @property {Boolean} hovering - true if a control point is currently being hovered over, false otherwise
 * @property {Boolean} interpolating - true if the curve interpolation is currently being displayed, false otherwise
 * @property {Boolean} paused - true if the interpolation is currently paused, false otherwise
 *
 */
class BezierCurve {
  /**
   * the default color of the curve
   * @type {String}
   */
  static curveColor = "blue";

  /**
   * the default width of the drawn curve
   * @type {Number}
   */
  static curveWidth = 5;

  /**
   * the color of the curve's control lines connecting the control points
   * @type {String}
   */
  static controlLineColor = "#888";

  /**
   * the color of the curve's control lines connecting the control points
   * @type {String}
   */

  /**
   * total steps to interpolate the curve
   */
  static totalSteps = 200;

  /**
   * the width of the control lines connecting the control points
   */
  static controlLineWidth = 1;

  /**
   * @constructor
   * @param {Array<Object>} controlPoints the coordinates of the control points
   * @param {Object>} coord - the coordinates of a control point
   * @param {Number} coords.x the x coordinate of the control point
   * @param {Number} coords.y the y coordinate of the control point
   * @param {String} [coords.label] the control point label
   */
  constructor(controlPoints) {
    this.controlPoints = [];
    this.loadControlPoints(controlPoints);

    // q0=p0, q1=p1, q2=p2, r0=q0, r1=q1, b=r0
    this.interpolationPoints = [];

    //create q points
    const sub0 = 0x2080;

    for (let i = 0; i < 3; i++) {
      this.interpolationPoints.push(
        new Point(
          { x: this.controlPoints[i].x, y: this.controlPoints[i].y },
          3,
          "black",
          `Q${String.fromCodePoint(sub0 + i)}`
        )
      );
    }
    //create r points
    for (let i = 0; i < 2; i++) {
      this.interpolationPoints.push(
        new Point(
          { x: this.controlPoints[i].x, y: this.controlPoints[i].y },
          3,
          "black",
          `R${String.fromCodePoint(sub0 + i)}`
        )
      );
    }

    //create B point
    this.interpolationPoints.push(
      new Point(
        { x: this.interpolationPoints[3].x, y: this.interpolationPoints[3].y },
        3,
        "black",
        "B"
      )
    );

    this.t = 0.0;
    this.dragging = false;
    this.hovering = false;
    this.interpolating = false;
    this.paused = false;
  }

  /**
   * Load the control points from an array of coordinates. Deletes any existing control points before loading.
   *
   * @param {Array<Object>} controlPoints the coordinates of the control points
   * @param {Object>} coord - the coordinates of a control point
   * @param {Number} coords.x the x coordinate of the control point
   * @param {Number} coords.y the y coordinate of the control point
   * @param {String} [coords.label] the control point label
   */

  loadControlPoints(controlPoints) {
    this.controlPoints = [];
    controlPoints.forEach((point) => {
      this.controlPoints.push(
        new DraggablePoint(point.coord, 12, Point.DEFAULT_COLOR, point.label)
      );
    });
  }

  /**
   * Draws the bezier curve using the canvas context
   *
   * @param {CanvasRenderingContext2D} ctx - the canvas context
   */
  draw(ctx) {
    //draw the curve
    ctx.beginPath();
    ctx.strokeStyle = BezierCurve.curveColor;
    ctx.lineWidth = BezierCurve.curveWidth;
    ctx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);
    ctx.bezierCurveTo(
      this.controlPoints[1].x,
      this.controlPoints[1].y,
      this.controlPoints[2].x,
      this.controlPoints[2].y,
      this.controlPoints[3].x,
      this.controlPoints[3].y
    );
    ctx.stroke();

    //draw the control lines
    ctx.strokeStyle = BezierCurve.controlLineColor;
    ctx.lineWidth = BezierCurve.controlLineWidth;
    ctx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);
    // line P0 - P1
    ctx.lineTo(this.controlPoints[1].x, this.controlPoints[1].y);
    ctx.stroke();
    // line P1 - P2
    ctx.lineTo(this.controlPoints[2].x, this.controlPoints[2].y);
    ctx.stroke();
    // line P2 - P3
    ctx.lineTo(this.controlPoints[3].x, this.controlPoints[3].y);
    ctx.stroke();
    ctx.closePath();

    //draw the control points
    this.controlPoints.forEach((point) => {
      point.draw(ctx);
    });

    //draw the interpolation points
    if (this.interpolating) {
      // line Q0-Q1
      ctx.beginPath();
      ctx.strokeStyle = "magenta";
      ctx.lineWidth = 2;
      ctx.moveTo(this.interpolationPoints[0].x, this.interpolationPoints[0].y);
      ctx.lineTo(this.interpolationPoints[1].x, this.interpolationPoints[1].y);
      ctx.stroke();

      // line Q1-Q2
      ctx.lineTo(this.interpolationPoints[2].x, this.interpolationPoints[2].y);
      ctx.stroke();
      ctx.closePath();

      // line R0-R1
      ctx.beginPath();
      ctx.strokeStyle = "lime";
      ctx.moveTo(this.interpolationPoints[3].x, this.interpolationPoints[3].y);
      ctx.lineTo(this.interpolationPoints[4].x, this.interpolationPoints[4].y);
      ctx.stroke();
      ctx.closePath();

      // draw interpolation points
      this.interpolationPoints.forEach((point) => {
        point.draw(ctx);
      });
    }
  }

  isPaused() {
    return this.paused;
  }

  pause() {
    this.paused = true;
  }

  run() {
    this.paused = false;
  }

  /**
   * Updates the coordinates of the interpolation points on the bezier curve at time t
   */
  interpolate() {
    // update Q0 - Q2
    for (let i = 0; i < 3; i++) {
      this.interpolationPoints[i].x =
        (1 - this.t) * this.controlPoints[i].x +
        this.t * this.controlPoints[i + 1].x;
      this.interpolationPoints[i].y =
        (1 - this.t) * this.controlPoints[i].y +
        this.t * this.controlPoints[i + 1].y;
    }

    // update R0 - R1
    for (let i = 3; i < 5; i++) {
      this.interpolationPoints[i].x =
        (1 - this.t) * this.interpolationPoints[i - 3].x +
        this.t * this.interpolationPoints[i - 2].x;
      this.interpolationPoints[i].y =
        (1 - this.t) * this.interpolationPoints[i - 3].y +
        this.t * this.interpolationPoints[i - 2].y;
    }

    //update B
    this.interpolationPoints[5].x =
      (1 - this.t) * this.interpolationPoints[3].x +
      this.t * this.interpolationPoints[4].x;
    this.interpolationPoints[5].y =
      (1 - this.t) * this.interpolationPoints[3].y +
      this.t * this.interpolationPoints[4].y;

    //update t
    if (!this.paused) {
      this.t += 1 / BezierCurve.totalSteps;
      if (this.t > 1) this.t = 0.0;
    }
  }
}

// get context from canvas element
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const sub0 = 0x2080;
const pointCoordinates = [
  {
    coord: { x: canvas.width / 8, y: (canvas.height * 5) / 6 },
    label: `P${String.fromCodePoint(sub0)}`,
  },
  {
    coord: { x: canvas.width / 3, y: canvas.height / 6 },
    label: `P${String.fromCodePoint(sub0 + 1)}`,
  },
  {
    coord: { x: (canvas.width * 2) / 3, y: canvas.height / 6 },
    label: `P${String.fromCodePoint(sub0 + 2)}`,
  },
  {
    coord: { x: (canvas.width * 7) / 8, y: (canvas.height * 5) / 6 },
    label: `P${String.fromCodePoint(sub0 + 3)}`,
  },
];

const curve = new BezierCurve(pointCoordinates);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

canvas.addEventListener("pointerdown", (e) => {
  curve.controlPoints.forEach((point) => {
    if (point.contains(e.clientX, e.clientY)) {
      if (!curve.dragging) {
        point.drag();
        curve.dragging = true;
        return;
      }
    }
  });
});

canvas.addEventListener("pointermove", (e) => {
  curve.controlPoints.forEach((point) => {
    if (point.dragging) {
      point.move(e.clientX, e.clientY);
      return;
    } else {
      if (!curve.dragging && point.contains(e.clientX, e.clientY)) {
        point.hover();
      } else {
        point.default();
      }
    }
  });
});

canvas.addEventListener("pointerup", (e) => {
  curve.controlPoints.forEach((point) => {
    if (point.dragging) {
      point.default();
      point.move(e.clientX, e.clientY);
      curve.dragging = false;
      return;
    }
  });
});

const showButton = document.querySelector(".show");
showButton.textContent = `${
  curve.interpolating ? "hide" : "show"
} interpolation`;
showButton.addEventListener("click", (e) => {
  curve.interpolating = !curve.interpolating;
  e.target.textContent = `${
    curve.interpolating ? "hide" : "show"
  } interpolation`;
  if (curve.interpolating) pauseButton.classList.remove("hidden");
  else pauseButton.classList.add("hidden");
});

const pauseButton = document.querySelector(".pause");
if (curve.interpolating) {
  pauseButton.classList.remove("hidden");
} else {
  pauseButton.classList.add("hidden");
}
pauseButton.textContent = curve.isPaused() ? "run" : "pause";
pauseButton.addEventListener("click", function (e) {
  if (curve.isPaused()) {
    curve.run();
  } else {
    curve.pause();
  }
  e.target.textContent = curve.isPaused() ? "run" : "pause";
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  curve.draw(ctx);
  if (curve.interpolating) {
    curve.interpolate();
  }
  requestAnimationFrame(animate);
}
animate();
