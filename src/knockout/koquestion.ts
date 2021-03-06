import * as ko from "knockout";
import { Question } from "survey-core";
import { SurveyElement } from "survey-core";
import { Helpers } from "survey-core";
import { ImplementorBase } from "./kobase";

export class QuestionImplementor extends ImplementorBase {
  private koDummy: any;
  koTemplateName: any;
  koElementType: any;
  toggleStateByClick: any;
  toggleStateByKeyUp: any;
  private _koValue = ko.observableArray<any>();
  constructor(public question: Question) {
    super(question);
    var isSynchronizing = false;
    this._koValue.subscribe((newValue) => {
      if (!isSynchronizing) {
        this.question.value = newValue;
      }
    });

    this.toggleStateByClick = () => {
      this.question.toggleState();
      if (this.question.isExpanded) return true;
      if (this.question.isCollapsed) return false;
    };
    this.toggleStateByKeyUp = (_: any, event: any) => {
      if (event.which !== 13) return;
      this.toggleStateByClick();
    };
    Object.defineProperty(this.question, "koValue", {
      get: () => {
        if (!Helpers.isTwoValueEquals(this._koValue(), this.getKoValue())) {
          try {
            isSynchronizing = true;
            this._koValue(this.getKoValue());
          } finally {
            isSynchronizing = false;
          }
        }
        return this._koValue;
      },
      enumerable: true,
      configurable: true,
    });
    var self = this;
    question.surveyLoadCallback = function () {
      self.onSurveyLoad();
    };
    this.koTemplateName = ko.pureComputed(function () {
      return self.getTemplateName();
    });
    this.koElementType = ko.observable("survey-question");
    (<any>this.question)["koElementType"] = this.koElementType;
    (<any>this.question)["koTemplateName"] = this.koTemplateName;
    (<any>this.question)["updateQuestion"] = function () {
      self.updateQuestion();
    };
    (<any>this.question)["koCss"] = ko.pureComputed(function () {
      return self.question.cssClasses;
    });
    (<any>this.question)["koRootCss"] = ko.pureComputed(function () {
      var cssRoot = self.question.cssRoot;
      if (self.question.isReadOnly)
        cssRoot += " " + self.question.cssClasses.disabled;
      return cssRoot;
    });
    (<any>this.question)["toggleStateByClick"] = this.toggleStateByClick;
    (<any>this.question)["toggleStateByKeyUp"] = this.toggleStateByKeyUp;

    (<any>this.question)["koErrorClass"] = ko.pureComputed(function () {
      return self.question.cssError;
    });
    question.registerFunctionOnPropertyValueChanged(
      "visibleIndex",
      function () {
        self.onVisibleIndexChanged();
      }
    );
    this.koDummy = ko.observable(0);
    (<any>this.question)["koQuestionAfterRender"] = function (
      el: any,
      con: any
    ) {
      self.koQuestionAfterRender(el, con);
    };
  }
  protected getKoValue() {
    return this.question.value;
  }
  protected updateQuestion() {
    this.updateKoDummy();
  }
  protected onVisibleIndexChanged() {
    this.updateKoDummy();
  }
  protected onSurveyLoad() {}
  protected getQuestionTemplate(): string {
    return this.question.getTemplate();
  }
  private getTemplateName(): string {
    if (
      this.question.customWidget &&
      !this.question.customWidget.widgetJson.isDefaultRender
    )
      return "survey-widget-" + this.question.customWidget.name;
    return "survey-question-" + this.getQuestionTemplate();
  }
  protected getNo(): string {
    return this.question.visibleIndex > -1
      ? this.question.visibleIndex + 1 + ". "
      : "";
  }
  protected updateKoDummy() {
    this.koDummy(this.koDummy() + 1);
    this.question.locTitle.onChanged();
  }
  protected koQuestionAfterRender(elements: any, con: any) {
    var el = SurveyElement.GetFirstNonTextElement(elements, true);
    if (!!el) {
      this.question.afterRenderQuestionElement(el);
      if (!!this.question.customWidget) {
        this.question.customWidget.afterRender(this.question, el);
      }
      ko.utils.domNodeDisposal.addDisposeCallback(el, () => {
        this.question.beforeDestroyQuestionElement(el);
        if (!!this.question.customWidget) {
          try {
            this.question.customWidget.willUnmount(this.question, el);
          } catch {
            console.warn("Custom widget will unmount failed");
          }
        }
      });
    }
  }

  private changeExpanded() {
    if (!this.question.isCollapsed && !this.question.isExpanded) return;
    if (this.question.isCollapsed) {
      this.question.expand();
    } else {
      this.question.collapse();
      return false;
    }
    return true;
  }

  public dispose() {
    super.dispose();
    this.koTemplateName.dispose();
    (<any>this.question)["koCss"].dispose();
    (<any>this.question)["koErrorClass"].dispose();
    this.question.unRegisterFunctionOnPropertyValueChanged("visibleIndex");
    (<any>this.question)["updateQuestion"] = undefined;
    (<any>this.question)["koQuestionAfterRender"] = undefined;
  }
}
