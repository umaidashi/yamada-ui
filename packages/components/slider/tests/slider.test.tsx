import { Matcher, cleanup } from "@testing-library/react"
import {
  a11y,
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@yamada-ui/test"
import { Slider, SliderFilledTrack, SliderThumb, SliderTrack } from "../src"
import { SliderProps, useSlider } from "../src/slider"

describe("<Slider />", () => {
  test("should render correctly", async () => {
    const { container } = render(<Slider />)
    await a11y(container)
  })

  test("should have correct class", () => {
    render(<Slider data-testid="slider" />)
    expect(screen.getByTestId("slider")).toHaveClass("ui-slider")
  })

  test("should have correct default value", () => {
    render(<Slider data-testid="slider" defaultValue={25} />)
    expect(
      screen.getByTestId("slider").getElementsByTagName("input")[0],
    ).toHaveValue(String(25))
  })

  test("Slider thumb should have correct aria-valuemin and aria-valuemax", () => {
    const { min, max } = { min: 0, max: 100 }
    render(<Slider min={min} max={max} />)

    const sliderThumb = screen.getByRole("slider")

    expect(sliderThumb).toHaveAttribute("aria-valuemin", String(min))
    expect(sliderThumb).toHaveAttribute("aria-valuemax", String(max))
  })

  test("Slider thumb should have correct aria-valuenow", () => {
    const defaultValue = 25
    render(<Slider defaultValue={defaultValue} />)

    const sliderThumb = screen.getByRole("slider")
    expect(sliderThumb).toHaveAttribute("aria-valuenow", String(defaultValue))
  })

  test("can change slider orientation", () => {
    const { container } = render(<Slider orientation="vertical" />)

    let sliderThumb = container.querySelector(".ui-slider__thumb")
    let filledTrack = container.querySelector(".ui-slider__track")

    expect(sliderThumb).toHaveAttribute("aria-orientation", "vertical")
    expect(filledTrack).toHaveStyle("height: 100%")

    cleanup()

    const { container: horizontalContainer } = render(
      <Slider orientation="horizontal" />,
    )

    sliderThumb = horizontalContainer.querySelector(".ui-slider__thumb")
    filledTrack = horizontalContainer.querySelector(".ui-slider__track")

    expect(sliderThumb).toHaveAttribute("aria-orientation", "horizontal")
    expect(filledTrack).toHaveStyle("width: 100%")
  })

  test("can be reversed", () => {
    const { container } = render(<Slider isReversed />)
    const filledTrack = container.querySelector(".ui-slider__track-filled")
    expect(filledTrack).toHaveStyle("right: 0%")
  })

  test("can be disabled", () => {
    render(<Slider data-testid="slider" isDisabled />)

    const slider = screen.getByTestId("slider")
    const sliderInput = slider.getElementsByTagName("input")[0]
    const sliderThumb = screen.getByRole("slider")

    expect(sliderInput).toBeDisabled()
    expect(sliderInput).toHaveAttribute("aria-disabled", "true")
    expect(sliderThumb).toHaveAttribute("aria-disabled", "true")
  })

  test("Slider readOnly tests", () => {
    const renderAndTestSlider = (props: SliderProps, testId: Matcher) => {
      render(<Slider data-testid={testId} {...props} />)

      const slider = screen.getByTestId(testId)
      const sliderInput = slider.getElementsByTagName("input")[0]
      const sliderThumb = screen.getByRole("slider")

      expect(sliderInput).toHaveAttribute("aria-readonly", "true")
      expect(sliderInput).toHaveAttribute("readonly", "")
      expect(sliderThumb).toHaveAttribute("aria-readonly", "true")
    }

    renderAndTestSlider({ isReadOnly: true }, "slider1")

    cleanup()

    renderAndTestSlider({ focusThumbOnChange: false }, "slider2")
  })

  test("can have correct step", async () => {
    const step = 10
    const defaultValue = 0
    const { container } = render(
      <Slider min={0} max={100} defaultValue={defaultValue} step={step} />,
    )

    const slider = screen.getByRole("slider")
    const sliderInput = container.getElementsByTagName("input")[0]

    await act(() => fireEvent.keyDown(slider, { key: "ArrowRight" }))

    expect(Number(sliderInput.value)).toBe(defaultValue + step)
  })

  test("should throw error when max is less than min", () => {
    const min = 10
    const max = 5

    const renderWithInvalidProps = () => render(<Slider min={min} max={max} />)

    const consoleSpy = vi.spyOn(console, "error")
    consoleSpy.mockImplementation(() => {})

    expect(renderWithInvalidProps).toThrow(
      "Do not assign a number less than 'min' to 'max'",
    )

    consoleSpy.mockRestore()
  })

  test("key down should perform correct actions", async () => {
    const min = 0
    const max = 100
    const tenStep = (max - min) / 10
    const { container } = render(
      <Slider min={min} max={max} step={10} defaultValue={0} />,
    )

    const slider = screen.getByRole("slider")
    const sliderInput = container.getElementsByTagName("input")[0]

    await act(() => fireEvent.keyDown(slider, { key: "ArrowRight" }))
    expect(Number(sliderInput.value)).toBe(10)
    await act(() => fireEvent.keyDown(slider, { key: "ArrowLeft" }))
    expect(Number(sliderInput.value)).toBe(0)

    await act(() => fireEvent.keyDown(slider, { key: "ArrowUp" }))
    expect(Number(sliderInput.value)).toBe(10)
    await act(() => fireEvent.keyDown(slider, { key: "ArrowDown" }))
    expect(Number(sliderInput.value)).toBe(0)

    await act(() => fireEvent.keyDown(slider, { key: "PageUp" }))
    expect(Number(sliderInput.value)).toBe(0 + tenStep)
    await act(() => fireEvent.keyDown(slider, { key: "PageDown" }))
    expect(Number(sliderInput.value)).toBe(0)

    await act(() => fireEvent.keyDown(slider, { key: "Home" }))
    expect(Number(sliderInput.value)).toBe(min)
    await act(() => fireEvent.keyDown(slider, { key: "End" }))
    expect(Number(sliderInput.value)).toBe(max)
  })

  test("if SliderTrack, SliderFilledTrack and SliderThumb are rendered", () => {
    const { container } = render(
      <Slider>
        <SliderTrack data-testid="slider-track">
          <SliderFilledTrack data-testid="slider-filled-track" />
        </SliderTrack>
        <SliderThumb data-testid="slider-thumb" />
      </Slider>,
    )

    expect(container).toContainElement(screen.getByTestId("slider-track"))
    expect(container).toContainElement(
      screen.getByTestId("slider-filled-track"),
    )
    expect(container).toContainElement(screen.getByTestId("slider-thumb"))
  })

  test("should allow custom thumb", () => {
    const { container } = render(
      <>
        <Slider
          thumbProps={{
            children: "test",
          }}
        />
        <Slider>
          <SliderThumb>test</SliderThumb>
        </Slider>
      </>,
    )

    const sliderThumbs = container.querySelectorAll(".ui-slider__thumb")

    sliderThumbs.forEach((sliderThumb) => {
      expect(sliderThumb.textContent).toBe("test")
    })
  })

  test("key down for keys not in the list should do nothing", async () => {
    const min = 0
    const max = 100
    const { container } = render(
      <Slider min={min} max={max} step={10} defaultValue={0} />,
    )

    const sliderThumb = screen.getByRole("slider")
    const sliderInput = container.getElementsByTagName("input")[0]

    await act(() => fireEvent.focus(sliderThumb))
    await act(() => fireEvent.keyDown(sliderThumb, { key: "Enter" }))
    expect(Number(sliderInput.value)).toBe(0)
  })

  test("should use slider with props", () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSlider({
        id: "test-slider",
        name: "test-slider",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        orientation: "horizontal",
        isReversed: false,
        focusThumbOnChange: true,
        onChangeStart,
        onChangeEnd,
        onChange,
      }),
    )

    expect(result.current.value).toBe(50)

    act(() => {
      result.current.stepUp()
    })
    expect(result.current.value).toBe(51)
    expect(onChange).toHaveBeenCalledWith(51)

    act(() => {
      result.current.stepDown()
    })
    expect(result.current.value).toBe(50)
    expect(onChange).toHaveBeenCalledWith(50)

    act(() => {
      result.current.reset()
    })
    expect(result.current.value).toBe(50)
    expect(onChange).toHaveBeenCalledWith(50)

    act(() => {
      result.current.stepTo(75)
    })
    expect(result.current.value).toBe(75)
    expect(onChange).toHaveBeenCalledWith(75)
  })

  test("Slider component with pointer events", () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const onChange = vi.fn()

    const { getByRole } = render(
      <Slider
        id="test-slider"
        name="test"
        min={0}
        max={100}
        step={1}
        defaultValue={50}
        orientation="horizontal"
        isReversed={false}
        onChangeStart={onChangeStart}
        onChangeEnd={onChangeEnd}
        onChange={onChange}
      />,
    )

    const slider = getByRole("slider")

    act(() => {
      fireEvent.pointerDown(slider)
      fireEvent.pointerUp(slider)
    })

    expect(onChangeStart).toHaveBeenCalledWith(50)
    expect(onChange).toHaveBeenCalled()
    expect(onChangeEnd).toHaveBeenCalled()
  })
})
